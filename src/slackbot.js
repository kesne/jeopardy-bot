import Slack from 'slack-client';
import trebek from './trebek';
import App from './models/App';
import winston from 'winston';

const autoReconnect = true;
const autoMarkMessagesAsRead = true;

export default class SlackBot {

  constructor() {
    this.start();
  }

  destroy() {
    if (this.slack) {
      this.slack.autoReconnect = false;
      this.slack.disconnect();
    }
  }

  async start() {
    const app = await App.get();
    this.slack = new Slack(app.apiToken, autoReconnect, autoMarkMessagesAsRead);

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
    winston.info('Slack websocket closed...');
    if (this.slack.autoReconnect && !this.slack.reconnecting) {
      this.slack.reconnect();
    }
  }

  onOpen() {
    winston.info(`JeopardyBot connected to ${this.slack.team.name} as @${this.slack.self.name}`);
  }

  onMessage(incoming) {
    const { text, channel: channelId, user: userId, ts: timestamp, subtype } = incoming;

    // Ignore messages from myself:
    if (userId === this.slack.self.id) {
      return;
    }

    const channel = this.slack.getChannelGroupOrDMByID(channelId);
    const channelName = channel.name;

    // Handle deleted and invalid messages:
    if (!text || !channelId) {
      return;
    }

    // TODO: Allow commands to specify their run location.
    if (!channel.is_channel) {
      channel.send(`I'm sorry, but you can only use jeopardybot in open channels right now.`);
      return;
    }

    const { name: userName } = this.slack.getUserByID(userId);
    trebek(text, {
      subtype,
      channel_name: channelName,
      channel_id: channelId,
      timestamp,
      user_id: userId,
      user_name: userName,
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
            color: '#F4AC79',
          }],
        });
      }
      return Promise.resolve();
    });
  }

  onError(err) {
    winston.error('slack error', err);
  }
}
