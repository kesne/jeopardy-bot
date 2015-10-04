import {Schema, model} from 'mongoose';

export const schema = new Schema({
  // TODO: Their slack username:
  username: {
    type: String,
    required: false
  },

  // Their slack ID:
  slackid: {
    type: String,
    required: true,
  },
  // Their actual name (for pretty printing):
  name: {
    type: String,
    required: true
  },

  // Trebek can be insulting to sassy users:
  sassFactory: {
    type: Number,
    default: 0
  },

  // The score a user has in the active game.
  // Not stored in the game because we don't really care about it there.
  // This jeopardy should be super fluid.
  // At the end of the rounds, this is flushed into the stats `money`.
  score: {
    type: Number,
    default: 0
  },

  // Simple stats:
  stats: {
    // Aggregate of all of the money won/lost from all games.
    money: {
      type: Number,
      default: 0
    },
    // Number of games won:
    won: {
      type: Number,
      default: 0
    },
    // Number of games lost: 
    lost: {
      type: Number,
      default: 0
    }
  }
});

schema.statics.get = async function({user_id: slackid, user_name: name}) {
  let user = await this.findOne({
    slackid
  });
  if (!user) {
    user = await this.create({
      name,
      slackid
    });
  }
  return user;
};

schema.methods.correct = function(value) {
  this.score += value;
  return this.save();
};

schema.methods.incorrect = function(value) {
  this.score -= value;
  return this.save();
}

schema.methods.won = function() {
  this.stats.won++;
  return this.endGame();
};

schema.methods.lost = function() {
  this.stats.lost++;
  return this.endGame();
};

schema.methods.endGame = function() {
  this.stats.money += this.score;
  this.score = 0;
  return this.save();
};

export const Person = model('Person', schema);
