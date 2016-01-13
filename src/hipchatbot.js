import Hipchatter from 'hipchatter';
import trebek from './trebek';
import winston from 'winston';
import App from './models/App';

export default class HipchatBot {
  constructor(express) {
    this.express = express;
    this.start();
  }

  async start() {
    this.app = await App.get();
    this.hipchatter = new Hipchatter(this.app.apiToken);
    this.express.post('/webhook', this.onMessage.bind(this));
  }

  onMessage(req) {
    const text = req.body.item.message.message;
    const subtype = req.body.event;
    const channel_name = req.body.item.room.name;
    const channel_id = (req.body.item.room.id).toString();
    // const timestamp = req.body.item.message.date;
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

  onError(err) {
    if (err) winston.error(err);
  }
}