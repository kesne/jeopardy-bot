import Hipchatter from 'hipchatter';
import trebek from './trebek';
import winston from 'winston';
import App from './models/App';
import { HIPCHAT_CALLBACK_URL } from './config';

export default class HipchatBot {
  constructor(express) {
    this.express = express;
    this.start();
  }

  async start() {
    this.app = await App.get();
    this.hipchatter = new Hipchatter(this.app.apiToken);
    this.registerWebhook();
    this.express.post('/webhook', this.onMessage.bind(this));
  }

  onMessage(req) {
    const text = req.body.item.message.message;
    const subtype = req.body.event;
    const channel_name = req.body.item.room.name;
    const channel_id = (req.body.item.room.id).toString();
    // const timestamp = req.body.item.message.date;
    // @todo: Convert returned timestamp into unixTimestamp
    const timestamp = Date.now();
    const user_id = req.body.item.message.from.id;
    const user_name = req.body.item.message.from.mention_name;

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

  registerWebhook() {
    if (!this.app.webhookId) {
      this.hipchatter.create_webhook('Jeopardy', { url: HIPCHAT_CALLBACK_URL + '/webhook', event: 'room_message' }, function(err, webhook) {
        if (err == null) {
          this.app.webhookId = webhook.id;
          winston.info('Successfully created webhook id:'+webhook.id+'.');
          this.app.save();
        } else {
          this.onError(err);
        }
      }.bind(this));

    } else {
      this.hipchatter.get_webhook('Jeopardy', this.app.webhookId, function(err, webhook) {
        if (err !== null) {
          this.onError(err);
          this.app.webhookId = null;
          this.registerWebhook();
        } else {
          if (webhook.event !== 'room_message' || webhook.url !== (HIPCHAT_CALLBACK_URL + '/webhook')) {
            winston.error('Existing webhook not valid. Creating a new one...');
            this.hipchatter.delete_webhook('Jeopardy', this.app.webhookId, this.onError.bind(this));
            this.app.webhookId = null;
            this.registerWebhook();
          }
          winston.info('Existing webhook '+webhook.id+' found and valid.');
        }
      }.bind(this));

    }
  }

  onError(err) {
    if (err) winston.error(err);
  }
}