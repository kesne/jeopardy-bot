import Command from '../Command';
import {Trigger, Only, Provide, NoLock} from '../utils';
import scoresMessage from './shared/scores';

@NoLock
@Trigger(/scores?/)
@Only('gameactive')
@Provide('game', 'channelContestants')
export default class Scores extends Command {
  async response() {
    const contestants = await this.channelContestants();
    const leaders = scoresMessage(contestants, this.data.channel_id);

    if (!leaders) {
      this.say('There are no scores yet!');
      return;
    }

    await this.say('Here are the current scores for this game:');

    this.say(`\n\n${leaders}`);
  }
}
