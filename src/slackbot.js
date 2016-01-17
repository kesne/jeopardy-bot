import { RtmClient, WebClient } from 'slack-client';
import { MemoryDataStore } from 'slack-client/lib/data-store';

import trebek from './trebek';
import App from './models/App';
import winston from 'winston';

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
    return new Promise((resolve) => {
      const web = new WebClient(token);
      web.auth.test((err, res) => {
        resolve(res);
      });
    });
  }

  broadcast(message, studio) {
    Object.values(this.slack.channels).filter((channel) => {
      return studio ? channel.id === studio : channel.isMember;
    }).forEach(channel => {
      this.web.chat.postMessage(channel.id, message, {
        as_user: true,
        parse: 'full',
      });
    });
  }

  async start() {
    const app = await App.get();

    this.slack = new MemoryDataStore();

    this.rtm = new RtmClient(app.apiToken, {
      logLevel: 'info',
    });
    this.web = new WebClient(app.apiToken);

    this.rtm.on('open', this.onOpen.bind(this));
    this.rtm.on('message', this.onMessage.bind(this));
    this.rtm.on('error', this.onError.bind(this));


    this.rtm.registerDataStore(this.slack);
    this.rtm.start();
  }

  onOpen() {
    // TODO: Team info:
    this.web.auth.test((err, info) => {
      winston.info(`JeopardyBot connected to "${info.team}" as @${info.user}`);
    });
  }

  onMessage(incoming) {
    const { text, channel: channelId, user: userId, ts: timestamp, subtype } = incoming;

    // Ignore messages from myself:
    if (userId === this.rtm.activeUserId) {
      return;
    }

    const channel = this.slack.getChannelGroupOrDMById(channelId);
    const channelName = channel.name;

    // Handle deleted and invalid messages:
    if (!text || !channelId) {
      return;
    }

    // TODO: Allow commands to specify their run location.
    if (!channel.isChannel) {
      this.rtm.send({
        type: 'message',
        channel: channelId,
        text: `I'm sorry, but you can only use jeopardybot in open channels right now.`,
      });
      return;
    }

    const { name: userName } = this.slack.getUserById(userId);

    // If a command needs a timestamp (i.e. to add a reaction), then pass true.
    const say = (message, url = '', needTimestamp) => {
      return new Promise((resolve, reject) => {
        if (url || needTimestamp) {
          const opts = {
            as_user: true,
          };

          if (url) {
            opts.attachments = JSON.stringify([
              {
                fallback: 'JeopardyBot Image',
                image_url: url,
                color: '#F4AC79',
              },
            ]);
          }

          this.web.chat.postMessage(channelId, message, opts, (err, msg) => {
            if (err) return reject(err);
            resolve(msg);
          });
        } else {
          this.rtm.send({
            id: 1,
            type: 'message',
            channel: channelId,
            text: message,
          }, () => {
            resolve();
          });
        }
      });
    };

    const addReaction = (reaction, ts = timestamp) => {
      return new Promise((resolve) => {
        this.web.reactions.add(reaction, {
          channel: channelId,
          timestamp: ts,
        }, () => {
          resolve();
        });
      });
    };

    const getReactions = (ts = timestamp) => {
      return new Promise((resolve) => {
        this.web.reactions.get({
          channel: channelId,
          timestamp: ts,
        }, (err, { message }) => {
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
