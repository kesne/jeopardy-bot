import { Schema, model } from 'mongoose';

export const schema = new Schema({

  // The owner of the slack bot:
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'Contestant',
  },

  platform: {
    type: 'String',
    enum: ['slack', 'hipchat'],
    required: true,
    default: 'slack',
  },

  imageMode: {
    type: 'String',
    enum: ['local', 'imgur'/* , 's3' */],
    required: true,
    default: 'imgur',
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

  webhookId: {
    type: 'Number'
  },

  hipchat: {
    oauthId: {
      type: String,
    },
    oauthSecret: {
      type: String,
    },
    accessToken: {
      token: {
        type: String,
      },
      expires: {
        type: Date,
      },
    },
  }
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
