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

    this.slack.login();
  }

  onOpen() {
    console.log(`JeopardyBot connected to ${this.slack.team.name} as @${this.slack.self.name}`);
  }

  // onMessage({text, channel: channel_id, user: user_id, ts: timestamp}) {
  onMessage(incoming) {
    const {text, channel: channel_id, user: user_id, ts: timestamp, subtype, message} = incoming;
    
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

    // Remind contestants on edits that we can't see them:
    if (subtype === 'message_changed') {
      const history = channel.getHistory()[message.ts];
      if (history && history.trebek) {
        channel.send(`I'm unable to process edited message. Try sending the message again.`);
      }
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
      // Mark the message as "trebek" so that we can know when we've processed it.
      incoming.trebek = true;
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
