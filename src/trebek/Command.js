import fetch from 'node-fetch';
import FormData from 'form-data';
import Contestant from '../models/Contestant';
import Game from '../models/Game';
import {lock, unlock} from './locks';
import * as config from '../config';

export default class Command {
  constructor(input, data) {
    const {valid, matches} = this.processTriggers(input);

    // Load data into our instance:
    this.valid = valid;
    this.data = data;
    this.matches = matches;
  }

  async start() {
    // Load in our providers now:
    await this.getProviders();

    // Finally, perform our requirement checks:
    this.checkRequirements();

    // Start our message string, which will be sent back to slack:
    this.message = '';

    // If we make it here, then we have everything we need to process the response:
    return await this.response(...this.matches);
  }

  async say(message, url = '') {
    if (config.MODE === 'response') {
      this.message += `${message} ${url} \n`;
    } else {
      await this.postToSlack(message, url);
    }
  }

  sayOptional(...args) {
    if (config.MODE !== 'response') {
      return this.say(...args);
    }
  }

  async postToSlack(message, url) {
    // Create our new form:
    const form = new FormData();
    form.append('token', config.API_TOKEN);
    form.append('username', config.USERNAME);
    form.append('text', message);
    form.append('channel', this.data.channel_id);
    form.append('as_user', JSON.stringify(true));

    if (url) {
      form.append('attachments', JSON.stringify([{
        fallback: 'Jeopardy Bot',
        image_url: url,
        icon_emoji: ':jbot:',
        color: '#F4AC79'
      }]));
    }

    return fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      body: form
    });
  }

  // Locking helpers
  lock() {
    return lock(this.data.channel_id);
  }
  unlock() {
    return unlock(this.data.channel_id);
  }

  processTriggers(input) {
    const triggers = this.constructor.triggers;

    let valid = false;
    const matches = triggers.map(trigger => {
      const m = trigger.exec(input);
      if (m !== null) {
        valid = true;
      }
      return m ? m.slice(1) : [];
    });

    return {
      valid,
      matches
    };
  }

  async getProviders() {
    const providers = this.constructor.providers || [];
    await Promise.all(providers.map(provide => {
      // Models:
      if (provide === 'games') {
        this.games = Game;
      }
      if (provide === 'contestants') {
        this.contestants = Contestant;
      }
      // Async values:
      if (provide === 'channelContestants') {
        this.channelContestants = async () => {
          Contestant.find().where('scores').elemMatch({
            channel_id: this.data.channel_id
          });
        };
      }
      // Values:
      if (provide === 'game') {
        return Game.forChannel(this.data).then(game => {
          this.game = game;
        });
      }
      if (provide === 'contestant') {
        return Contestant.get(this.data).then(contestant => {
          this.contestant = contestant;
        });
      }
    }));
  }

  checkRequirements() {
    const requirements = this.constructor.requirements || [];
    for (const requirement of requirements) {
      if (!this.checkRequirement(requirement)) {
        throw new Error('Unmet requirement.');
      }
    }
  }

  checkRequirement(requirement) {
    if (requirement === 'gameactive') {
      return this.game && !this.game.isComplete();
    }
    if (requirement === 'gameinactive') {
      return !this.game || this.game.isComplete();
    }
    if (requirement === 'mydailydouble') {
      return (this.game.isDailyDouble() && this.game.dailyDouble.contestant === this.contestant.slackid && !this.game.dailyDouble.wager);
    }
    if (requirement === 'clue') {
      return this.game.activeQuestion;
    }
    if (requirement === 'noclue') {
      return !this.game.activeQuestion;
    }
  }

  response() {
    throw new Error('The response method should be overwritten.');
  }
}
