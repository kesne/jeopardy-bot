import fetch from 'node-fetch';
import moment from 'moment';
import { Schema, model } from 'mongoose';
import { DiceCoefficient, JaroWinklerDistance } from 'natural';

import * as config from '../config';

async function jServiceCategories() {
  const randomPage = Math.ceil(Math.random() * config.LAST_PAGE);
  let res = await fetch(`http://jservice.io/api/categories?count=${config.CATEGORY_COUNT}&offset=${randomPage}`);
  let categories = await res.json();
  // Invalid category set for some reason. Try again.
  if (categories.length !== config.CATEGORY_COUNT) {
    return jServiceCategories();
  }
  return categories;
};

async function jServiceCategory(id) {
  let res = await fetch(`http://jservice.io/api/category?id=${id}`);
  let category = await res.json();

  let clues = [];
  let reclaimed = [];
  let found = 0;
  category.clues.some(clue => {
    if (clue.value) {
      if (!clues[clue.value]) {
        clues[clue.value] = clue;
        found++;
      }
    } else {
      // This question wasn't included because it doesn't have a value,
      // but we could assign one in to "reclaim" this question:
      reclaimed.push(clue);
    }
    return found === 5;
  });

  // Bad category set, let's reclaim it!
  if (found < 5) {
    config.VALUES.forEach(value => {
      if (!clues[value]) {
        clues[value] = reclaimed.pop();
        // Assign it the value we gave it:
        clues[value].value = value;
      }
    });
  }

  // Return the clues:
  return clues.filter(c => c);
}

async function jServiceQuestions(ids) {
  let questions = await Promise.all(
    ids.map(id => jServiceCategory(id))
  );
  return [].concat(...questions);
};

export const schema = new Schema({
  categories: [{
    id: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  }],

  channel_id: {
    type: String,
    required: true
  },

  lastCategory: {
    type: Number
  },

  activeQuestion: {
    type: Number
  },

  questionStart: {
    type: Date
  },

  contestantAnswers: {
    type: Array,
    default: []
  },

  questions: [{
    id: {
      type: Number,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    answered: {
      type: Boolean,
      default: false
    },
    category_id: {
      type: Number,
      required: true
    }
  }]
});

// Gets the clue with the timeout:
schema.virtual('clue').get(function() {
  const clue = this.getClue();
  // There's no active question if we've timed out:
  if (moment().isAfter(moment(this.questionStart).add(45, 'seconds'))) {
    return false;
  }
  return clue;
});

schema.methods.answered = function(id) {
  return this.contestantAnswers.some(i => i === id);
};

// Grab the active game for the channel:
schema.statics.forChannel = function({channel_id}) {
  return this.findOne({
    channel_id,
    questions: {
      $elemMatch: { answered: false }
    }
  });
};

// End all games:
schema.statics.end = async function({channel_id}) {
  const contestants = await this.model('Contestant').find({
    scores: {
      $elemMatch: { channel_id }
    }
  });
  await Promise.all(contestants.map(contestant => contestant.endGame({channel_id})));
  return this.remove({channel_id});
};

// Start a new game:
schema.statics.start = async function({channel_id}) {
  const game = await this.forChannel({channel_id});
  if (game) {
    throw new Error('An game is already in progress.');
  }
  // Clear out the existing game:
  await this.end({channel_id});
  // Build a new game:
  const categories = await jServiceCategories();
  const questions = await jServiceQuestions(categories.map(cat => cat.id));
  return this.create({
    channel_id,
    categories,
    questions
  });
};

// Gets the clue without the timeout:
schema.methods.getClue = function() {
  return this.questions.find(q => {
    return q.id === this.activeQuestion
  });
};

// Get a new clue for a given value and title
schema.methods.newClue = async function({category, value}) {
  value = parseInt(value, 10);
  if (!config.VALUES.includes(value)) {
    throw new RangeError('value');
  }
  if (this.clue) {
    throw new Error('already active');
  }
  // If there's an active clue that has timed out, let's go ahead and time it out:
  if (this.getClue()) {
    await this.answer();
  }

  // Handle asking for the same category:
  let selectedCategory;
  if (category === '--same--' && this.lastCategory) {
    selectedCategory = this.lastCategory;
  } else {
    let cc = this.categories.map(cat => {
      return {
        id: cat.id,
        rank: DiceCoefficient(cat.title, category)
      }
    }).sort((a, b) => {
      if (a.rank > b.rank) {
        return -1;
      } else if (b.rank > a.rank) {
        return 1;
      }
      return 0;
    }).filter(x => {
      return x.rank > 0.5;
    })[0];
    if (cc) {
      selectedCategory = cc.id;
    }
  }

  // Invalid ask:
  if (!selectedCategory) {
    throw new RangeError('category');
  }
  const question = this.questions.find(q => {
    return (q.category_id === selectedCategory && q.value === value);
  });

  if (question.answered) {
    throw new Error('Question has already been answered.');
  }

  this.lastCategory = selectedCategory;
  this.activeQuestion = question.id;
  return this.save();
};

schema.methods.clueSent = function() {
  this.questionStart = Date.now();
  return this.save();
};

schema.methods.guess = async function({contestant, guess}) {
  if (!this.activeQuestion) {
    throw new Error('clue');
  }
  if (!this.clue) {
    throw new Error('timeout');
  }
  if (this.answered(contestant.slackid)) {
    throw new Error('contestant')
  }

  // This contestant has now guessed:
  this.contestantAnswers.push(contestant.slackid);
  await this.save();

  // Get the answers:
  let answers = this.clue.answer.split(/\(|\)/).filter(n => n);
  // Edge case: names:
  answers.push(answers.join(' '));
  return answers.some(answer => {
    let similarity = DiceCoefficient(guess, answer);
    if (similarity >= config.ACCEPTED_SIMILARITY) {
      return true;
    } else if (similarity >= config.JARO_KICKER) {
      let jaroSimilarity = JaroWinklerDistance(guess, answer);
      return jaroSimilarity >= config.JARO_SIMILARITY;
    } else {
      return false;
    }
  });
};

schema.methods.answer = function() {
  this.questions.some(q => {
    if (this.activeQuestion === q.id) {
      q.answered = true;
      return true;
    }
  });
  this.contestantAnswers = [];
  this.activeQuestion = undefined;
  this.questionStart = undefined;
  this.lastCategory = undefined;
  return this.save();
};

export const Game = model('Game', schema);
