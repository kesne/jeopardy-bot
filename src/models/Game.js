import {Schema} from 'mongoose';

export const schema = new Schema({
  // Their slack username:
  username: {
    type: String,
    required: true
  },
  // Their slack ID:
  slackid: {
    type: String,
    required: true,
  },
  // Their actual name (pretty printing):
  fullName: {
    type: string,
    required:true
  },

  // Trebek can be insulting to sassy users:
  sassFactory: {
    type: Boolean,
    default: false
  },

  // The money a user has in the active game.
  // Not stored in the game because we don't really care about it there.
  // This jeopardy should be super fluid.
  // At the end of the rounds, this is flushed into the stats money.
  currentMoney: {
    type: Number,
    default: 0
  }

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

export const Person = mongoose.model('Person', schema);
