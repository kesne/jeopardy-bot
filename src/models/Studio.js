import { Schema, model } from 'mongoose';

export const schema = new Schema({
  id: {
    type: String,
    required: true,
    index: true,
  },

  // Human-readable name of the studio:
  name: {
    type: String,
    required: true,
  },

  // The type of studio:
  type: {
    type: String,
    enum: ['channel', 'private', 'dm'],
    default: 'channel',
  },

  // Studios can be disabled to turn the bot off in a channel:
  enabled: {
    type: Boolean,
    default: true,
    required: true,
  },

  values: {
    // The timeout for clues (in seconds):
    timeout: {
      type: Number,
      min: 1,
      default: 30,
    },
    // Timeout for challenges (in seconds):
    challengeTimeout: {
      type: Number,
      min: 1,
      default: 15,
    },
    boardControlTimeout: {
      type: Number,
      min: 1,
      default: 4,
    },
    // Minimum number of votes for a given challenge to be valid:
    minimumChallengeVotes: {
      type: Number,
      min: 1,
      default: 2,
    },
    // The percentage of votes that need to verify a challenge:
    challengeAcceptenceThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.65,
    },
    // TODO:
    // The strictness of the answer checking:
    answerSimilarityMode: {
      type: String,
      enum: ['strict', 'moderate', 'flexible'],
      default: 'moderate',
    },
    // TODO:
    // The type of games to generate:
    gameType: {
      type: String,
      enum: ['any', 'regular', 'championship', 'kids', 'teens'],
      default: 'any',
    },
  },

  // Feature flags:
  features: {
    challenges: {
      type: Boolean,
      default: true,
    },

    // autoChallenges: {
    //   enabled: {
    //     type: Boolean,
    //     default: false
    //   }
    // },

    boardControl: {
      type: Boolean,
      default: true,
    },

    dailyDoubles: {
      type: Boolean,
      default: true,
    },

    endGame: {
      type: Boolean,
      default: true,
    },

    stats: {
      type: Boolean,
      default: true,
    },

    greetings: {
      type: Boolean,
      default: true,
    },

    guessReactions: {
      type: Boolean,
      default: true,
    },

    challengeReactionVoting: {
      type: Boolean,
      default: true,
    },

    // autoDoubleJeopardy: {
    //   name: 'Automatic Double Jeopardy',
    //   'Automatically starts a double jeopardy round after the normal jeopardy round ends.',
    //   enabled: {
    //     type: Boolean,
    //     default: false
    //   }
    // },

    // finalJeopardy: {
    //   name: 'Final Jeopardy Round',
    //   description: 'Asks a final jeopardy question at the end of the game.',
    //   enabled: {
    //     type: Boolean,
    //     default: false
    //   }
    // },

    // buzzers: {
    //   name: 'Buzzers',
    //   description: 'Requires contestants to buzz in with "buzz" to make a guess.',
    //   enabled: {
    //     type: Boolean,
    //     default: false
    //   }
    // },

    // roomTopic: {
    //   name: 'Room Topic',
    //   description: 'Sets the room topic based on the game state.',
    //   enabled: {
    //     type: Boolean,
    //     default: false
    //   }
    // },
  },

  // The total number of games that have been played in this studio:
  games: {
    type: Number,
    default: 0,
  },
  // The total number of guesses that have been made in this studio:
  guesses: {
    type: Number,
    default: 0,
  },
}, {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
});

schema.statics.get = async function({ id, name }) {
  let doc = await this.findOne({ id });
  if (!doc) {
    const app = await this.model('App').get();
    doc = await this.create({
      id,
      name,
      enabled: app.studiosEnabledByDefault,
    });
  }
  // The channel has been renamed:
  if (doc.name !== name) {
    doc.name = name;
    await doc.save();
  }
  return doc;
};

export default model('Studio', schema);
