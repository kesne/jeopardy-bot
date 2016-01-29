import HipchatterBase from 'hipchatter';
import trebek from './trebek';
import winston from 'winston';
import fetch from 'node-fetch';
import moment from 'moment';
import App from './models/App';
import { HIPCHAT_CALLBACK_URL } from './config';

export default class Hipchatter extends HipchatterBase {
  get_session(callback) {
    this.request('get', 'oauth/token/'+this.token, callback);
  }
}

export default class HipchatBot {
  constructor(express) {
    express.get('/capabilities', this.buildCapabilitiesDescriptor.bind(this));
    express.post('/install', this.install.bind(this));
    express.post('/webhook', this.onMessage.bind(this));
    express.delete('/install/*', this.uninstall.bind(this));
    this.start();
  }

  async start() {
    this.app = await App.get();
    if (!this.app.hipchat.oauthId || !this.app.hipchat.oauthSecret) {
      throw new Error('Before you can run Jeopardy Bot on Hipchat, you must first install it as an add-on.');
    }
    await this.validateToken(this.app.hipchat);
    this.hipchatter = new Hipchatter(this.app.hipchat.accessToken.token);
    const roomId = await this.getInstalledRoomId();
    this.registerWebhook(roomId, 'room_message');
  }

  getInstalledRoomId() {
    return new Promise(resolve => {
      this.hipchatter.get_session((err, session) => {
        resolve(session.client.room.id);
      });
    });
  }

  async validateToken(hipchat) {
    if (!hipchat.accessToken.token || moment().isAfter(hipchat.accessToken.expires_in)) {
      const { access_token: token, expires_in: expires } = await this.getAccessToken(hipchat.oauthId, hipchat.oauthSecret);
      this.app.hipchat.accessToken.token = token;
      this.app.hipchat.accessToken.expires = moment().add(expires, 'seconds');
      await this.app.save();
    }
  }

  buildCapabilitiesDescriptor(req, res) {
    const descriptor = {
      "name": "Jeopardy Bot",
      "description": "This is Jeopardy!",
      "key": "com.jeopardy.bot",
      "links": {
        "homepage": "https://github.com/kesne/jeopardy-bot",
        "self": HIPCHAT_CALLBACK_URL + "/capabilities",
      },
      "capabilities": {
        "hipchatApiConsumer": {
          "scopes": [
            "admin_room",
            "send_notification",
          ]
        },
        "installable": {
          "callbackUrl": HIPCHAT_CALLBACK_URL + "/install",
          "allowGlobal": false,
          "allowRoom": true,
        },
      },
    }

    res.send(descriptor);
  }

  async install(req, res) {
    const { capabilitiesUrl, oauthId, roomId, oauthSecret } = req.body;
    const tokenUrl = await this.getTokenUrl(capabilitiesUrl);
    const { access_token: token, expires_in: expires } = await this.getAccessToken(oauthId, oauthSecret, tokenUrl);

    this.app.hipchat.oauthId = oauthId;
    this.app.hipchat.oauthSecret = oauthSecret;
    this.app.hipchat.accessToken.token = token;
    this.app.hipchat.accessToken.expires = moment().add(expires, 'seconds');
    await this.app.save();
    winston.info(`JeopardyBot successfully installed in room ${roomId}.`);

    res.sendStatus(200);
    this.start();
  }

  uninstall(req, res) {
    // Hipchat will cleanup any webhooks created with this token, so no need to manually do that
    this.app.collection.updateOne({ _id: this.app._id }, {
      $unset: {
        'hipchat.oauthId': this.app.hipchat.oauthId,
        'hipchat.oauthSecret': this.app.hipchat.oauthSecret,
        'hipchat.accessToken.token': this.app.hipchat.accessToken.token,
      },
      $pullAll: {
        webhooks: this.app.hipchat.webhooks,
      },
    }, async (err, result) => {
      if (err === null) {
        await this.app.save();
        res.sendStatus(200);
      } else {
        this.onError(err);
      }
    });
  }

  getTokenUrl(tokenUrl) {
    return fetch(tokenUrl)
      .then(res => res.json())
      .then(json => json.capabilities.oauth2Provider.tokenUrl);
  }

  getAccessToken(oauthId, oauthSecret, tokenUrl = 'https://api.hipchat.com/v2/oauth/token') {
    const auth = new Buffer(`${oauthId}:${oauthSecret}`).toString('base64');
    return fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic '+auth,
      },
      body: 'grant_type=client_credentials&scope[]=admin_room&scope[]=send_notification'
    }).then(res => res.json());
  }

  onMessage(req) {
    this.validateToken(this.app.hipchat);
    const { 
      event: subtype,
      item: { 
        room: { name: channel_name, }, 
        message: { 
          message: text, 
          from: { 
            id: user_id, 
            mention_name: user_name,
          },
        },
      },
    } = req.body;

    const channel_id = (req.body.item.room.id).toString();
    const timestamp = Date.parse(req.body.item.message.date) / 1000;
    
    const say = (message, url = '') => {
      if (url) { message += `<br /><img src="${url}" width="420" height="259" /><br />`; }
      this.hipchatter.notify(channel_name, { message: message, token: this.app.apiToken }, this.onError.bind(this));
    };

    trebek(text, {
      subtype,
      channel_name,
      channel_id,
      timestamp,
      user_id,
      user_name,
    }, say);
  }

  async registerWebhook(roomId, event) {
    for (let webhookId of this.app.hipchat.webhooks) {
      let wh;
      try {
        wh = await this.validateWebhook(roomId, webhookId, event);
      } catch (err) {
        this.onError(err);
      }

      if (wh) {
        return;
      }
    }

    // If we get here we don't yet have a valid webhook, so let's create one
    winston.error('No valid webhooks found. Creating a new one...');
    this.hipchatter.create_webhook(roomId, {
      url: `${HIPCHAT_CALLBACK_URL}/webhook`,
      event: event,
    }, (err, webhook) => {
      if (err === null) {
        this.app.hipchat.webhooks.push(webhook.id);
        winston.info(`Successfully created ${event} webhook with id: ${webhook.id}.`);
        this.app.save();
      } else {
        this.onError(err);
      }
    });
  }

  validateWebhook(roomId, webhookId, event) {
    return new Promise((resolve, reject) => {
      this.hipchatter.get_webhook(roomId, webhookId, (err, webhook) => {
        if (err === null && webhook.event === event && webhook.url === HIPCHAT_CALLBACK_URL+'/webhook') {
          winston.info(`Existing ${event} webhook ${webhook.id} found and valid.`);
          resolve(webhook);
        } else {
          reject(`${webhookId} is not a valid ${event} webhook for room ${roomId}`);
        }
      });
    });
  }

  onError(err) {
    if (err) winston.error(err);
  }
}