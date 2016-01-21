import Slack from 'slack-client';
import trebek from './trebek';
import App from './models/App';
import winston from 'winston';
import fetch from 'node-fetch';

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

  authTest({ token }) {
    return fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `token=${token}`,
    }).then(res => res.json());
  }

  broadcast(message, studio) {
    Object.values(this.slack.channels).filter((channel) => {
      return studio ? channel.id === studio : channel.is_member;
    }).forEach(channel => {
      channel.send(message);
    });
  }

  async start() {
    const app = await App.get();
    this.slack = new Slack(app.apiToken, true, true);

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

    const say = (message, url = '') => {
      return new Promise((resolve) => {
        let msg;
        if (!url) {
          msg = channel.send(message);
        } else {
          msg = channel.postMessage({
            text: message,
            as_user: true,
            attachments: [{
              fallback: 'JeopardyBot',
              image_url: url,
              color: '#F4AC79',
            }],
          });
        }
        // Actually wait for messages to send:
        if (msg._onMessageSent) {
          const oMS = msg._onMessageSent.bind(msg);
          msg._onMessageSent = (...args) => {
            oMS(...args);
            resolve(msg.ts);
          };
        } else {
          resolve();
        }
      });
    };

    const addReaction = (reaction, ts = timestamp) => {
      return new Promise((resolve) => {
        this.slack._apiCall('reactions.add', {
          name: reaction,
          channel: channelId,
          timestamp: ts,
        }, () => {
          resolve();
        });
      });
    };

    const getReactions = (ts = timestamp) => {
      return new Promise((resolve) => {
        this.slack._apiCall('reactions.get', {
          channel: channelId,
          timestamp: ts,
        }, ({ message }) => {
          resolve(message.reactions);
        });
      });
    };

    trebek(text, {
      subtype,
      channel_name: channelName,
      channel_id: channelId,
      timestamp,
      user_id: userId,
      user_name: userName,
    }, say, addReaction, getReactions);
  }

  onError(err) {
    winston.error('slack error', err);
  }
}
