import fetch from 'node-fetch';
import FormData from 'form-data';
import App from '../models/App';
import Studio from '../models/Studio';
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
    // Inject the models:
    this.models = {
      Game,
      Contestant
    };
  }

  async start(customSay) {
    // Load in our providers now:
    await this.installProviders();

    // Finally, perform our requirement checks:
    this.checkRequirements();

    await Promise.all([
      this.installStudio(),
      this.installApp()
    ]);

    // Inject custom say commands:
    if (customSay) {
      this.say = customSay;
    }

    // Start our message string, which will be sent back to slack:
    this.message = '';

    // If we make it here, then we have everything we need to process the response:
    return await this.response(...this.matches);
  }

  async say(message, url = '') {
    if (this.app.hasApi()) {
      await this.postToSlack(message, url);
    } else {
      this.message += `${message} ${url} \n`;
    }
  }

  sayOptional(...args) {
    if (this.app.hasApi()) {
      return this.say(...args);
    }
  }

  async postToSlack(message, url) {
    // Create our new form:
    const form = new FormData();
    form.append('token', this.app.api_token);
    form.append('username', this.app.username);
    // TODO: Icon emoji?
    form.append('text', message);
    form.append('channel', this.data.channel_id);
    form.append('as_user', JSON.stringify(true));

    if (url) {
      form.append('attachments', JSON.stringify([{
        fallback: 'Jeopardy Bot',
        image_url: url,
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

  async installProviders() {
    const providers = this.constructor.providers || [];
    await Promise.all(providers.map(provide => {
      // Async values:
      if (provide === 'channelContestants') {
        this.channelContestants = () => {
          return Contestant.find().where('scores').elemMatch({
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

  async installStudio() {
    this.studio = await Studio.get(this.data.channel_id);
  }
  
  async installApp() {
    this.app = await App.get();
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
