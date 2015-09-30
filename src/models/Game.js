import fetch from 'node-fetch';
import {Schema, model} from 'mongoose';

const PAGE_LENGTH = 6;
const LAST_PAGE = 18412;

const jServiceCategories = () => {
  const randomPage = Math.ceil(Math.random() * LAST_PAGE);
  return fetch(`http://jservice.io/api/categories?count=${PAGE_LENGTH}&offset=${randomPage}`)
    .then(res => res.json())
    .then(categories => {
      // Invalid category set for some reason. Try again.
      if (categories.length !== 6) {
        return jServiceCategories();
      }
      return categories;
    });
};

const jServiceCategory = (id) => {
  return fetch(`http://jservice.io/api/category?id=${id}`)
    .then(res => res.json())
    .then(res => {
      let clues = [];
      let reclaimed = [];
      let found = 0;
      res.clues.some(clue => {
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
        [200, 400, 600, 800, 1000].forEach((value) => {
          if (!clues[value]) {
            clues[value] = reclaimed.pop();
            // Assign it the value we gave it:
            clues[value].value = value;
          }
        });
      }

      // Return the clues:
      return clues.filter(c => c);
    });
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

// Grab the active game:
schema.statics.activeGame = function() {
  return this.findOne({'questions': {$elemMatch: {answered: false}}});
};

// End all games:
schema.statics.end = function() {
  return this.remove();
};

// Start a new game:
schema.statics.start = async function() {
  const active = await this.activeGame();
  if (active) {
    throw new Error('An active game is already in progress.');
  }
  await Game.end();
  const categories = await jServiceCategories();
  const questions = await jServiceQuestions(categories.map(cat => cat.id));
  return this.create({
    categories,
    questions
  });


  // return this.activeGame()
  //   .then(active => {
  //     if (active)
  //       throw new Error('An active game is already in progress.');
  //   })
  //   .then(() => Game.end())
  //   .then(() => jServiceCategories())
  //   .then(categories => Promise.all([
  //     categories,
  //     ...categories.map(cat => jServiceQuestions(cat.id))
  //   ]))
  //   .then(([categories, ...questions]) => 
  //     this.create({
  //       categories,
  //       questions: [].concat(...questions)
  //     })
  //   );
}

export const Game = model('Game', schema);
