import {Schema, model} from 'mongoose';

export const schema = new Schema({
  id: {
    type: String,
    required: true
  },

  // TODO: Disable by default?
  // Studios can be disabled to turn the bot off in a channel:
  enabled: {
    type: Boolean,
    default: true
  },

  // TODO: Elevate these to top level.
  // Generic config for the bot:
  config: {
    username: {
      type: String,
      required: true,
      default: 'jeopardybot'
    },

    timeout: {
      type: Number,
      min: 1,
      default: 30
    },
    challengeTimeout: {
      type: Number,
      min: 1,
      default: 15
    },
    minimumChallengeVotes: {
      type: Number,
      min: 1,
      default: 2
    },
    challengeAcceptenceThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.65
    },
    answerSimilarityMode: {
      type: String,
      enum: ['strict', 'moderate', 'flexible'],
      default: 'moderate'
    },
    gameType: {
      type: String,
      enum: ['any', 'regular', 'championship', 'kids', 'teens'],
      default: 'any'
    }
  },

  // Feature flags:
  features: {
    challenges: {
      type: Boolean,
      default: true
    },
    boardControl: {
      type: Boolean,
      default: true
    },
    dailyDoubles: {
      type: Boolean,
      default: true
    },
    endGame: {
      type: Boolean,
      default: true
    },
    autoDoubleJeopardy: {
      type: Boolean,
      default: false
    },
    finalJeopardy: {
      type: Boolean,
      default: false
    },
    buzzers: {
      type: Boolean,
      default: false
    },
    roomTopic: {
      type: Boolean,
      default: false
    }
  },

  games: {
    type: Number,
    default: 0
  },
  guesses: {
    type: Number,
    default: 0
  }
});

schema.statics.get = async function(id) {
  let doc = await this.findOne({id});
  if (!doc) {
    doc = await this.create({id});
  }
  return doc;
};

export default model('Studio', schema);
