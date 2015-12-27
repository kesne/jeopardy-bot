import { Schema, model } from 'mongoose';

export const schema = new Schema({

  // The owner of the slack bot:
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Contestant',
  },

  username: {
    type: 'String',
    default: 'jeopardybot',
  },
  icon_emoji: {
    type: 'String',
    default: ':jbot:',
  },
  // TODO: Figure this out:
  // icon_url: {
  //   type: String
  // },
  mode: {
    type: 'String',
    enum: ['bot', 'hybrid', 'response'],
    required: true,
    default: 'response',
  },
  imageMode: {
    type: 'String',
    enum: ['local', 'imgur', 's3'],
    required: true,
    default: 'local',
  },
  api_token: {
    type: 'String',
  },
  verify_token: {
    type: 'String',
  },

  aws: {
    key: {
      type: 'String',
    },
    secret: {
      type: 'String',
    },
  },
});

schema.methods.isBot = function() {
  return this.mode === 'bot';
};

schema.methods.hasApi = function() {
  return Boolean(this.api_token);
};

schema.statics.findOrCreate = async function() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

let appConfig;
schema.statics.get = async function() {
  if (!appConfig) {
    appConfig = await this.findOrCreate();
  }
  return appConfig;
};

// Additional schema validation:
schema.pre('save', function(next) {
  // Invalid mode:
  if (!this.api_token && (this.mode === 'bot' || this.mode === 'hybrid')) {
    this.mode = 'reponse';
    console.log(new Error('Mode requries an API token.'));
  }
  next();
});

// Update the cached reference:
schema.post('save', doc => {
  appConfig = doc;
});

export default model('App', schema);
