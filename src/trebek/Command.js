import App from '../models/App';
import Studio from '../models/Studio';
import Contestant from '../models/Contestant';
import Game from '../models/Game';
import { lock, unlock } from './locks';

export default class Command {
  constructor(input, data) {
    // Verify that all of our "whens" are met:
    if (this.hasWhens()) {
      const valid = this.processWhens(data.subtype);
      this.valid = valid;
      this.matches = [];
    } else {
      const { valid, matches } = this.processTriggers(input);
      this.valid = valid;
      this.matches = matches;
    }

    // Load data into our instance:
    this.data = data;

    // Inject the models:
    this.models = {
      Game,
      Contestant,
    };
  }

  async start() {
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

    // Start our message string, which will be sent back to slack:
    this.message = '';

    // If we make it here, then we have everything we need to process the response:
    return await this.response(...this.matches);
  }

  useSay(say) {
    // Inject custom say commands:
    this.say = say;
  }

  useAddReaction(addReaction) {
    // Inject custom reaction command:
    this.addReaction = addReaction;
  }

  useGetReations(getReactions) {
    // Inject custom getReactions command:
    this.getReactions = getReactions;
  }

  getReactions() {
    throw new Error('Getreactions method should be provided with the "useGetReations" function.');
  }

  addReaction() {
    throw new Error('AddReaction method should be provided with the "useAddReaction" function.');
  }

  say() {
    throw new Error('Say method should be provided with the "useSay" function.');
  }

  // Locking helpers
  lock() {
    return lock(this.data.channel_id);
  }
  unlock() {
    return unlock(this.data.channel_id);
  }

  hasWhens() {
    return !!this.constructor.whens;
  }

  processWhens(subtype) {
    const whens = this.constructor.whens;
    if (!whens) {
      return true;
    }
    return whens.some(when => subtype === when);
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
      if (!this.studio.features[feature]) {
        throw new Error('Unmet feature.');
      }
    }
  }

  checkRequirements() {
    const requirements = this.constructor.requirements || [];
    for (const requirementDescriptor of requirements) {
      let requirementName = requirementDescriptor;
      let requirementErrorMessage = null;
      if (Array.isArray(requirementDescriptor)) {
        requirementName = requirementDescriptor[0];
        requirementErrorMessage = requirementDescriptor[1];
      }
      if (!this.checkRequirement(requirementName)) {
        if (requirementErrorMessage) {
          this.say(requirementErrorMessage);
        }
        throw new Error('Unmet requirement.');
      }
    }
  }

  checkRequirement(requirement) {
    switch (requirement) {
      case 'gameactive':
        return this.game && !this.game.isComplete();
      case 'gameinactive':
        return !this.game || this.game.isComplete();
      case 'mydailydouble':
        const isDailyDouble = this.game.isDailyDouble();
        const myDailyDouble = this.game.dailyDouble.contestant === this.contestant.id;
        const hasWager = !!this.game.dailyDouble.wager;
        return (isDailyDouble && myDailyDouble && !hasWager);
      case 'clue':
        return this.game.activeQuestion;
      case 'noclue':
        return !this.game.activeQuestion;
      default:
        return true;
    }
  }

  response() {
    throw new Error('The response method should be overwritten.');
  }
}
