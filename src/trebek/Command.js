import App from '../models/App';
import Studio from '../models/Studio';
import Contestant from '../models/Contestant';
import Game from '../models/Game';
import { lock, unlock } from './locks';
import { post } from './slack';

export default class Command {

  constructor(input, data) {
    const { valid, matches } = this.processTriggers(input);

    // Load data into our instance:
    this.valid = valid;
    this.data = data;
    this.matches = matches;
    // Inject the models:
    this.models = {
      Game,
      Contestant,
    };
  }

  async start(customSay) {
    // Load in our providers now:
    await this.installProviders();

    // Perform our requirement checks:
    this.checkRequirements();

    await Promise.all([
      this.installStudio(),
      this.installApp(),
    ]);

    // Check to make sure we have the correct features enabled:
    this.checkFeatures();

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
    await post(message, url);
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
      matches,
    };
  }

  async installProviders() {
    const providers = this.constructor.providers || [];
    await Promise.all(providers.map(provide => {
      // Async values:
      if (provide === 'channelContestants') {
        this.channelContestants = () => {
          return Contestant.find().where('scores').elemMatch({
            channel_id: this.data.channel_id,
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
    this.studio = await Studio.get({
      id: this.data.channel_id,
      name: this.data.channel_name,
    });
    if (!this.studio.enabled) {
      throw new Error('Studio disabled');
    }
  }

  async installApp() {
    this.app = await App.get();
  }

  checkFeatures() {
    const features = this.constructor.features || [];
    for (const feature of features) {
      if (!this.studio.features[feature].enabled) {
        throw new Error('Unmet feature.');
      }
    }
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
