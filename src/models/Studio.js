import {Schema, model} from 'mongoose';

export const schema = new Schema({
  id: {
    type: String,
    required: true,
    index: true
  },
  
  // Human-readable name of the studio:
  name: {
    type: String,
    required: true
  },

  // Studios can be disabled to turn the bot off in a channel:
  enabled: {
    type: Boolean,
    default: false
  },
  
  values: {
    // The timeout for clues (in seconds):
    timeout: {
      type: Number,
      min: 1,
      default: 30
    },
    // Timeout for challenges (in seconds):
    challengeTimeout: {
      type: Number,
      min: 1,
      default: 15
    },
    boardControlTimeout: {
      type: Number,
      min: 1,
      default: 4
    },
    // Minimum number of votes for a given challenge to be valid:
    minimumChallengeVotes: {
      type: Number,
      min: 1,
      default: 2
    },
    // The percentage of votes that need to 
    challengeAcceptenceThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.65
    },
    // TODO:
    // The strictness of the answer checking:
    answerSimilarityMode: {
      type: String,
      enum: ['strict', 'moderate', 'flexible'],
      default: 'moderate'
    },
    // TODO:
    // The type of games to generate:
    gameType: {
      type: String,
      enum: ['any', 'regular', 'championship', 'kids', 'teens'],
      default: 'any'
    }
  },

  // Feature flags:
  features: {
    challenges: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    
    // autoChallenges: {
    //   enabled: {
    //     type: Boolean,
    //     default: false
    //   }
    // },
    
    boardControl: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    
    dailyDoubles: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    
    endGame: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    
    stats: {
      enabled: {
        type: Boolean,
        default: true
      }
    }
    
    // autoDoubleJeopardy: {
    //   name: 'Automatic Double Jeopardy',
    //   description: 'Automatically starts a double jeopardy round after the normal jeopardy round ends.',
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
    default: 0
  },
  // The total number of guesses that have been made in this studio:
  guesses: {
    type: Number,
    default: 0
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

schema.virtual('features.challenges.name').get(() => 'Challenges');
schema.virtual('features.challenges.description').get(() =>
  'Allows challenges to be called on questions that were incorrectly judged.'
);

schema.virtual('features.boardControl.name').get(() => 'Board Control');
schema.virtual('features.boardControl.description').get(() =>
  'Restricts category selection to the contestant that last answered correctly.'
);

schema.virtual('features.dailyDoubles.name').get(() => 'Daily Doubles');
schema.virtual('features.dailyDoubles.description').get(() =>
  'Enables daily double wagers for certain questions.'
);

schema.virtual('features.endGame.name').get(() => 'Manual Game End');
schema.virtual('features.endGame.description').get(() =>
  'Allows the game to be ended with the "end game" message'
);

schema.virtual('features.stats.name').get(() => 'Stats');
schema.virtual('features.stats.description').get(() =>
  'Allows contestants to check the stats of themselves and other players.'
);

schema.statics.get = async function({id, name}) {
  let doc = await this.findOne({id});
  if (!doc) {
    doc = await this.create({id, name});
  }
  // The channel has been renamed:
  if (doc.name !== name) {
    doc.name = name;
    await doc.save();
  }
  return doc;
};

export default model('Studio', schema);
