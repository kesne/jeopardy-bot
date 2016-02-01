import { Schema, model } from 'mongoose';

export const schema = new Schema({

  // The owner of the slack bot:
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Contestant',
  },

  platform: {
    type: 'String',
    enum: ['slack'],
    required: true,
    default: 'slack',
  },

  imageMode: {
    type: 'String',
    enum: ['local', 'imgur'/* , 's3' */],
    required: true,
    default: 'imgur',
  },

  host: {
    type: 'String',
  },

  apiToken: {
    type: 'String',
  },

  studiosEnabledByDefault: {
    type: 'Boolean',
    required: true,
    default: true,
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

// Force the cached reference to get updated:
export function invalidate() {
  appConfig = null;
}

export default model('App', schema);
