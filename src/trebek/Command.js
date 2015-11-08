import fetch from 'node-fetch';
import FormData from 'form-data';
import Contestant from '../models/Contestant';
import Game from '../models/Game';
import {lock, unlock} from './locks';
import * as config from '../config';

export default class Command {
  constructor(input, data) {
    const {valid, matches} = this.processTriggers(input);

    // Only proceed if we have a match:
    if (valid) {
      // Load data into our instance:
      this.valid = valid;
      this.data = data;
      this.matches = matches;

      this.promise = this.getProviders().then(providers => {
        // Load in data from our providers:
        Object.assign(this, providers);

        // Finally, perform our requirement checks:
        this.checkRequirements();

        // Start our message string, which will be sent back to slack:
        this.message = '';

        // If we make it here, then we have everything we need to process the response:
        return this.response(...matches);
      });
    }
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
      return this.send(...args);
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
      return m && m.slice(1);
    });

    return {
      valid,
      matches
    };
  }

  async getProviders() {
    const provides = {};
    const providers = this.constructor.providers || [];
    for (const provide of providers) {
      let val;
      // Models:
      if (provide === 'games') {
        val = Game;
      }
      if (provide === 'contestants') {
        val = Contestant;
      }
      // Values:
      if (provide === 'game') {
        val = await Game.forChannel(this.data);
      }
      if (provide === 'contestant') {
        val = await Contestant.get(this.data);
      }
      provides[provide] = val;
    }
    return provides;
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
      return this.game.liveClue();
    }
    if (requirement === 'noclue') {
      return !this.game.liveClue();
    }
  }

  response() {
    throw new Error('The response method should be overwritten.');
  }
}
