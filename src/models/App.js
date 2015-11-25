import {Schema, model} from 'mongoose';

export const schema = new Schema({
  username: {
    type: 'String',
    default: 'jeopardybot'
  },
  icon_emoji: {
    type: 'String',
    default: ':jbot:'
  },
  // icon_url: {
  //   type: String
  // },
  // TODO: Validate the mode is compatible with the API_TOKEN.
  mode: {
    type: 'String',
    enum: ['bot', 'hybrid', 'response'],
    required: true,
    default: 'response'
  },
  api_token: {
    type: 'String'
  },
  verify_token: {
    type: 'String'
  },
  
  aws: {
    key: {
      type: 'String'
    },
    secret: {
      type: 'String'
    }
  }
});

schema.methods.isBot = function() {
  return this.mode === 'bot';
};

schema.methods.hasApi = function() {
  return Boolean(this.api_token);
};

let appConfig;

schema.statics.findOrCreate = async function() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

schema.statics.get = async function() {
  if (!appConfig) {
    appConfig = await this.findOrCreate();
  }
  return appConfig;
};

// Update the cached reference:
schema.post('save', doc => {
  appConfig = doc;
});

export default model('App', schema);
