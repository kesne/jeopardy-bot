import fetch from 'node-fetch';
import { Schema, model } from 'mongoose';
import { DiceCoefficient, JaroWinklerDistance } from 'natural';

const PAGE_LENGTH = 6;
const LAST_PAGE = 18412;

const ACCEPTED_SIMILARITY = 0.7;
const JARO_SIMILARITY = 0.9;
const JARO_KICKER = 0.5;

async function jServiceCategories() {
  const randomPage = Math.ceil(Math.random() * LAST_PAGE);
  let res = await fetch(`http://jservice.io/api/categories?count=${PAGE_LENGTH}&offset=${randomPage}`);
  let categories = await res.json();
  // Invalid category set for some reason. Try again.
  if (categories.length !== 6) {
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
    [200, 400, 600, 800, 1000].forEach(value => {
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

  lastCategory: {
    type: Number
  },

  activeQuestion: {
    type: Number
  },

  questonStart: {
    type: Date
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

schema.virtual('activeClue').get(function() {
  return this.questions.find(q => {
    return q.id === this.activeQuestion
  });
});

// Grab the active game:
schema.statics.activeGame = function() {
  return this.findOne({'questions': {$elemMatch: {answered: false}}});
};

// End all games:
schema.statics.end = async function() {
  return this.remove();
};

// Start a new game:
schema.statics.start = async function() {
  const game = await this.activeGame();
  if (game) {
    throw new Error('An active game is already in progress.');
  }
  await Game.end();
  const categories = await jServiceCategories();
  const questions = await jServiceQuestions(categories.map(cat => cat.id));
  return this.create({
    categories,
    questions
  });
};

// Get a new clue for a given value and title
schema.statics.getClue = async function(title, value) {
  value = parseInt(value, 10);
  if (![200, 400, 600, 800, 1000].includes(value)) {
    throw new RangeError('value');
  }
  const game = await this.activeGame();
  if (!game) {
    throw new Error('No active game.');
  }
  if (game.activeQuestion) {
    throw new Error('There is already an active question.');
  }
  const category = game.categories.map(cat => {
    return {
      id: cat.id,
      rank: JaroWinklerDistance(cat.title, title)
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

  // Invalid ask:
  if (!category) {
    throw new RangeError('category');
  }
  const question = game.questions.find(q => {
    return (q.category_id === category.id && q.value === value);
  });

  if (question.answered) {
    throw new Error('Question has already been answered.');
  }

  game.lastCategory = category.id;
  game.activeQuestion = question.id;
  return game.save();
};

schema.statics.clueSent = async function(title, value) {
  const game = await this.activeGame();
  if (!game) {
    throw new Error('No active game.');
  }
  game.questionStart = Date.now();
  return game.save();
};

schema.statics.guess = async function(guess) {
  const game = await this.activeGame();
  if (!game) {
    throw new Error('No active game.');
  }
  if (!game.activeQuestion) {
    throw new Error('There is no active question.');
  }
  let answer = game.activeClue.answer;
  let similarity = DiceCoefficient(guess, answer);
  if (similarity >= ACCEPTED_SIMILARITY) {
    return true;
  } else if (similarity >= JARO_KICKER) {
    let jaroSimilarity = JaroWinklerDistance(guess, answer);
    return jaroSimilarity >= JARO_SIMILARITY;
  } else {
    return false;
  }
};

schema.statics.answer = async function() {
  const game = await this.activeGame();
  game.questions.some(q => {
    if (game.activeQuestion === q.id) {
      q.answered = true;
      return true;
    }
  });
  game.activeQuestion = undefined;
  game.questionStart = undefined;
  game.lastCategory = undefined;
  return game.save();
};

export const Game = model('Game', schema);
