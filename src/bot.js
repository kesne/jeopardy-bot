import Slack from 'slack-client';
import trebek from './trebek';
import * as config from './config';

const slackToken = config.API_TOKEN;
const autoReconnect = true;
const autoMarkMessagesAsRead = true;

export default class Bot {
  constructor() {
    this.slack = new Slack(slackToken, autoReconnect, autoMarkMessagesAsRead);

    this.slack.on('open', this.onOpen.bind(this));
    this.slack.on('message', this.onMessage.bind(this));
    this.slack.on('error', this.onError.bind(this));

    // Slack's internal websocket reconnect isn't reliable:
    this.slack.on('close', this.onClose.bind(this));
    this.slack.on('loggedIn', this.onLoggedIn.bind(this));
    const slackReconnect = this.slack.reconnect;
    this.slack.reconnect = () => {
      this.slack.reconnecting = true;
      slackReconnect.call(this.slack);
    };

    this.slack.login();
  }

  onLoggedIn() {
    this.slack.reconnecting = false;
  }

  onClose() {
    console.log('Slack websocket closed...');
    if (this.slack.autoReconnect && !this.slack.reconnecting) {
      this.slack.reconnect();
    }
  }

  onOpen() {
    console.log(`JeopardyBot connected to ${this.slack.team.name} as @${this.slack.self.name}`);
  }

  onMessage(incoming) {
    const {text, channel: channel_id, user: user_id, ts: timestamp, subtype} = incoming;

    // Ignore messages from myself:
    if (user_id === this.slack.self.id) {
      return;
    }

    const channel = this.slack.getChannelGroupOrDMByID(channel_id);

    if (subtype === 'channel_join') {
      const {name: user_name} = this.slack.getUserByID(user_id);
      channel.send(`Welcome to #${channel.name}, @${user_name}! To learn how to play, just type "help".`);
      return;
    }

    // Handle deleted and invalid messages:
    if (!text || !channel_id || subtype) {
      return;
    }

    // TODO: Allow commands to specify their run location.
    if (!channel.is_channel) {
      channel.send('Sorry, but you can only use jeopardybot in open channels right now.');
      return;
    }
    const {name: user_name} = this.slack.getUserByID(user_id);
    trebek(text, {
      channel_id,
      timestamp,
      user_id,
      user_name
    }, (message, url = '') => {
      if (!url) {
        channel.send(message);
      } else {
        channel.postMessage({
          text: message,
          as_user: true,
          attachments: [{
            fallback: 'Jeopardy Bot',
            image_url: url,
            icon_emoji: ':jbot:',
            color: '#F4AC79'
          }]
        });
      }
      return Promise.resolve();
    });
  }

  onError(err) {
    console.log('got error', err);
  }
}
