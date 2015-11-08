// TODO: Autochallenge
import Command from '../Command';
import {Trigger, Only, Provide, currency} from '../utils';
import * as config from '../../config';

@Trigger(
  /(challenge)|(y)|(n)/
)
@Only(
  'gameactive',
  'noclue'
  // ,'challenge'
)
@Provide(
  'games',
  'game',
  'contestants',
  'contestant'
)
export default class Challenge extends Command {
  async response([challenge, yes]) {
    if (!challenge && this.game.isChallengeStarted()) {
      const correct = Boolean(yes);
      // Register the vote if we haven't already voted:
      const hasVoted = this.game.challenge.votes.some(vote => vote.contestant === this.contestant.slackid);
      if (!hasVoted) {
        this.game.challenge.votes.push({
          contestant: this.contestant.slackid,
          correct
        });
        await this.game.save();
      }
    } else if (challenge && !this.game.isChallengeStarted()) {
      const channel_id = this.data.channel_id;
      const [contestants, {guess, answer}] = await Promise.all([
        this.contestants.find().where('scores').elemMatch({
          channel_id
        }),
        this.game.startChallenge({
          contestant: this.contestant
        })
      ]);
      const contestantString = contestants.map(contestant => `@${contestant.name}`).join(', ');
      await this.say(`A challenge has been called on the last question.\nI thought the correct answer was \`${answer}\`, and the guess was \`${guess}\`.`);
      await this.say(`${contestantString}, do you think they were right? Respond with just "y" or "n" to vote.`);

      setTimeout(async () => {
        await this.lock();
        // We need to refresh the document because it could be outdated:
        const game = await this.games.forChannel({
          channel_id: game.channel_id
        });
        try {
          const {channelScore} = await game.endChallenge();
          this.say(`Congrats, ${this.contestant.name}, your challenge has succeeded. Your score is now ${currency(channelScore.value)}.`);
        } catch (e) {
          if (e.message.includes('min')) {
            this.say('The challenge failed. There were not enough votes. Carry on!');
          } else if (e.message.includes('votes')) {
            this.say('The challenge failed. Not enough people agreed. Carry on!');
          } else {
            console.log('Unknown challenge error...', e);
          }
        } finally {
          this.unlock();
        }
      }, ((config.CHALLENGE_TIMEOUT) * 1000) + 100);
    }
  }
}
