import Command from '../Command';
import {Trigger, Only, Provide, currency} from '../utils';
import endgameMessage from './shared/endgame';
import {boardImage, dailydoubleImage, clueImage} from '../../cola';
import * as config from '../../config';

@Trigger(
  /(?:ill take |give me |choose )?(.*) for \$?(\d{3,4})(?: alex| trebek)?/,
  /(same)/,
  /gimme (.*)/
)
@Only(
  'gameactive',
  'noclue'
)
@Provide(
  'game',
  'contestant',
  'channelContestants'
)
class Clue extends Command {
  async response([category, value], [sameLowest], [gimmeCategory]) {
    if (gimmeCategory) {
      category = gimmeCategory;
      value = -1;
    }
    // We support some shorthands for clue selection:
    if (sameLowest) {
      category = '--same-lowest--';
      value = -1;
    }
    if (category === 'same' || category === 'same category') {
      category = '--same--';
    }

    try {
      await this.game.newClue({
        contestant: this.contestant.slackid,
        category,
        value
      });
    } catch (e) {
      if (e.message.includes('value')) {
        this.say(`I'm sorry, I can't give you a clue for that value.`);
      } else if (e.message.includes('category')) {
        this.say(`I'm sorry, I don't know what category that is. Try being more specific.`);
      } else {
        console.log('Unexpected category selection error.', e);
      }
      // Just ignore it:
      return;
    }

    const clue = this.game.getClue();

    // Give the user a little more feedback when we can:
    this.sayOptional(`OK, \`${this.game.getCategory().title}\` for ${currency(clue.value)}...`);

    // You found a daily double!
    if (this.game.isDailyDouble()) {
      const dailyDoubleUrl = await dailydoubleImage();

      // Make sure that the daily double image displays before we do anything else:
      await this.say('Answer: Daily Double', dailyDoubleUrl);
      const channelScore = this.contestant.channelScore(this.data.channel_id).value;
      this.say(`Your score is ${currency(channelScore)}. What would you like to wager, @${this.contestant.name}? ` +
               `(max of ${currency(Math.max(channelScore, clue.value))}, min of $5)`);
      // TODO: Wager timeouts
    } else {
      const url = await clueImage({
        game: this.game
      });

      // Mark that we're sending the clue now:
      await this.game.clueSent();
      this.say(`Here's your clue.`, url);

      // Additional feedback after we timeout (plus five seconds for some flexibility):
      if (config.MODE !== 'response') {
        setTimeout(async () => {
          // Grab the lock so we block incoming requests:
          await this.lock();
          // Try to be safe and unlock even when we fail:
          try {
            // We need to refresh the document because it could be outdated:
            const game = await this.models.Game.forChannel({
              channel_id: this.game.channel_id
            });
            if (game.isTimedOut()) {
              // Get the current clue:
              const clue = game.getClue();

              // We timed out, so mark this question as done.
              await game.answer();

              this.sayOptional(`Time's up! The correct answer is \`${clue.answer}\`.`);

              if (game.isComplete()) {
                const contestants = await this.channelContestants();
                this.sayOptional(await endgameMessage(game, contestants, this.data.channel_id));
              } else {
                const url = await boardImage({game});
                this.sayOptional('Select a new clue.', url);
              }
            }
          } finally {
            this.unlock();
          }
        }, (config.CLUE_TIMEOUT * 1000) + 100);
      }
    }
  }
}

export default Clue;
