import HipchatterBase from 'hipchatter';
import trebek from './trebek';
import winston from 'winston';
import request from 'request';
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
    this.express = express;
    this.start();
  }

  async start() {
    this.app = await App.get();
    if (!this.app.hipchat.oauthId || !this.app.hipchat.oauthSecret) {
      throw new Error('Before you can run Jeopardy Bot on Hipchat, you must first install it as an add-on.');
    }

    this.express.get('/capabilities', this.buildCapabilitiesDescriptor.bind(this));
    this.express.post('/install', this.install.bind(this));
    await this.validateToken(this.app.hipchat);
    this.hipchatter = new Hipchatter(this.app.hipchat.accessToken.token);
    const roomId = await this.getInstalledRoomId();
    this.registerWebhook(roomId, 'room_message');
    // this.registerWebhook(roomId, 'room_enter');
    this.express.post('/webhook', this.onMessage.bind(this));
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
      const { access_token, expires_in } = await this.getAccessToken(hipchat.oauthId, hipchat.oauthSecret);
      this.app.hipchat.accessToken.token = access_token;
      this.app.hipchat.accessToken.expires = moment().add(expires_in, 'seconds');
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
    this.app.hipchat.oauthId = oauthId;
    this.app.hipchat.oauthSecret = oauthSecret;

    let tokenUrl;
    request(capabilitiesUrl, (err, res, body) => {
      if (!err && res.statusCode === 200) {
        tokenUrl = JSON.parse(body).capabilities.oauth2Provider.tokenUrl;
      } else {
        this.onError(err);
      }
    });

    const { access_token, expires_in } = await this.getAccessToken(oauthId, oauthSecret, tokenUrl);
    this.app.hipchat.accessToken.token = access_token;
    this.app.hipchat.accessToken.expires = moment().add(expires_in, 'seconds');
    await this.app.save();

    res.sendStatus(200);
  }

  getAccessToken(oauthId, oauthSecret, tokenUrl = 'https://api.hipchat.com/v2/oauth/token') {
    return new Promise((resolve, reject) => {
      request({
        method: 'POST',
        url: tokenUrl,
        auth: {
          user: oauthId,
          pass: oauthSecret,
        },
        form: {
          grant_type: 'client_credentials',
          scope: [
            'admin_room',
            'send_notification',
          ],
        },
      }, (err, res, body) => {
        if (!err) {
          resolve(JSON.parse(body));
        } else {
          reject(err);
        }
      });
    });
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
      if (url) { message += '<br />' + '<img src="'+url+'" width="420" height="259" /><br />'; }
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
    for (let webhookId of this.app.webhooks) {
      const wh = await new Promise((resolve, reject) => {
        this.hipchatter.get_webhook(roomId, webhookId, function(err, webhook) {
          if (err === null && webhook.event === event && webhook.url === HIPCHAT_CALLBACK_URL+'/webhook') {
            winston.info('Existing '+event+' webhook '+webhook.id+' found and valid.');
            resolve(true);
          } else {
            this.onError(err);
            resolve(false);
          }
        }.bind(this));
      });

      if (wh) {
        return;
      }
    }

    // If we get here we don't yet have a valid webhook, so let's create one
    winston.error('No valid webhooks found. Creating a new one...');
    this.hipchatter.create_webhook(roomId, { url: HIPCHAT_CALLBACK_URL+'/webhook', event: event }, function(err, webhook) {
      if (err === null) {
        this.app.webhooks.push(webhook.id);
        winston.info('Successfully created '+event+' webhook with id: '+webhook.id+'.');
        this.app.save();
      } else {
        this.onError(err);
      }
    }.bind(this));
  }

  onError(err) {
    if (err) winston.error(err);
  }
}