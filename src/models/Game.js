import moment from 'moment';
import dehumanize from 'dehumanize-date';
import {Schema, model} from 'mongoose';
import {DiceCoefficient, JaroWinklerDistance} from 'natural';

import {generateGame} from '../japi';
import * as config from '../config';

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

  // Information for the daily double:
  dailyDouble: {
    // The user that the daily double is currently assigned to:
    contestant: {
      type: String
    },
    // The wager of the daily double:
    wager: {
      type: Number,
      // Wager must be at least 5:
      min: 5
    }
  },

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
    dailyDouble: {
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
  if (this.isTimedOut()) {
    return false;
  }
  return clue;
});

schema.virtual('isDailyDouble').get(function() {
  const clue = this.getClue();
  return clue.dailyDouble;
});

schema.methods.isTimedOut = function() {
  return moment().isAfter(moment(this.questionStart).add(config.CLUE_TIMEOUT, 'seconds'));
};

schema.methods.isComplete = function() {
  return !this.questions.some(question => !(question && question.answered));
};

schema.methods.answered = function(id) {
  return this.contestantAnswers.some(i => i === id);
};

// End all games:
schema.methods.end = async function() {
  const contestants = await this.model('Contestant').find({
    scores: {
      $elemMatch: {
        channel_id: this.channel_id
      }
    }
  });
  await Promise.all(
    contestants.sort((a, b) => {
      const {value: aScore} = a.channelScore(this.channel_id);
      const {value: bScore} = b.channelScore(this.channel_id);
      if (bScore > aScore) {
        return 1;
      }
      if (aScore > bScore) {
        return -1;
      }
      return 0;
    }).map((contestant, i) => {
      let won = false;
      let lost = false;
      // If the game is complete, the player may have won or lost:
      if (this.isComplete()) {
        if (i === 0) {
          // If we're first, then we have the highest score:
          won = true;
        } else {
          // Otherwise, we lost this game:
          lost = true;
        }
      }
      // Mark the contestant game as ended:
      return contestant.endGame({
        channel_id: this.channel_id,
        won,
        lost
      });
    })
  );
  return this.remove();
};

// Grab the active game for the channel:
schema.statics.forChannel = function({channel_id}) {
  return this.findOne({channel_id});
};

// Start a new game:
schema.statics.start = async function({channel_id}) {
  const game = await this.forChannel({channel_id});

  // Clear out existing (ended) games:
  if (game && !game.isComplete()) {
    throw new Error('A game is already in progress.');
  } else if (game) {
    await game.end();
  }

  // Grab a random episode from the API:
  const episode = await generateGame();
  // Extract the questions and categories:
  const {clues: questions, categories} = episode.roundOne;

  return this.create({
    channel_id,
    categories,
    questions
  });
};

// Gets the clue without the timeout:
schema.methods.getClue = function() {
  return this.questions.find(q => q.id === this.activeQuestion);
};

schema.methods.getCategory = function() {
  const clue = this.getClue();
  return this.categories.find(cat => cat.id === clue.category_id);
};

// Get a new clue for a given value and title.
schema.methods.newClue = async function({category, value, contestant}) {
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
    const cc = this.categories.map(cat => {
      return {
        id: cat.id,
        rank: DiceCoefficient(cat.title, category)
      };
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

    // If we can extract a category from the input, let's use it:
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

  // If the question is a daily double, add in the contestant:
  if (question.dailyDouble) {
    this.dailyDouble.contestant = contestant;
  }

  this.lastCategory = selectedCategory;
  this.activeQuestion = question.id;
  return this.save();
};

schema.methods.clueSent = function() {
  this.questionStart = Date.now();
  return this.save();
};

// Helper function to determine if something is just a raw number:
const isNumber = num => {
  return !isNaN(num);
};

schema.methods.guess = async function({contestant, guess}) {
  if (!this.activeQuestion) {
    throw new Error('clue');
  }
  if (!this.clue) {
    throw new Error('timeout');
  }
  if (this.answered(contestant.slackid)) {
    throw new Error('contestant');
  }
  // Daily doubles can only be answered by the user that selected them
  if (this.isDailyDouble && this.dailyDouble.contestant !== contestant) {
    throw new Error('dailydouble');
  }
  if (this.isDailyDouble && !this.dailyDouble.wager) {
    throw new Error('wager');
  }

  // This contestant has now guessed:
  this.contestantAnswers.push(contestant.slackid);
  await this.save();

  // Get the answers:
  const answers = this.clue.answer.split(/\(|\)/).filter(n => n);
  answers.push(answers.join(' '));
  return answers.some(answer => {
    // Number matching:
    if (isNumber(answer)) {
      // Numbers much be identical:
      return parseInt(answer, 10) === parseInt(guess, 10);
    }

    // Date matching:
    const answerDate = dehumanize(answer);
    if (answerDate) {
      const guessDate = dehumanize(guess);
      return moment(answerDate).isSame(moment(guessDate));
    }

    // String matching:
    const similarity = DiceCoefficient(guess, answer);
    if (similarity >= config.ACCEPTED_SIMILARITY) {
      return true;
    } else if (similarity >= config.JARO_KICKER) {
      const jaroSimilarity = JaroWinklerDistance(guess, answer);
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
  this.dailyDouble = {};
  return this.save();
};

export const Game = model('Game', schema);
