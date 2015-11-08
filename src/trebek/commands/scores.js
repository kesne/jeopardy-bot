import Command from '../Command';
import {Trigger, Only, Provide} from '../utils';

@Trigger('scores')
@Only('gameactive')
@Provide('contestants')
export default class Scores extends Command {
  async response() {
    const leaders = '';

    if (!leaders) {
      this.say('There are no scores yet!');
      return;
    }

    await this.say('Here are the current scores for this game:');

    this.say(`\n\n${leaders}`);
  }
}
