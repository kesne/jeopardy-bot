import Command from '../Command';
import { Trigger, Only, Provide, currency } from '../utils';
import endgameMessage from './shared/endgame';
import newClueMessage from './shared/newclue';
import { boardImage, dailydoubleImage, clueImage } from '../../cola';
import winston from 'winston';

@Trigger(
  /(?:ill take |give me |choose )?(.*?) (?:for )?\$?(\d{3,4})(?: alex| trebek)?/,
  /(same)/,
  /(gimme)(?: for \$?(\d{3,4}))?(?: (.+?))?/
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
  // TODO: Put --same--, --same-lowest--, and --random-- into a constants file.
  async response([inputCategory, inputValue], [sameLowest], [gimme, gimmeValue, gimmeCategory]) {
    let category = inputCategory;
    let value = inputValue;
    // Random clue:
    if (gimme && !gimmeValue && !gimmeCategory) {
      category = '--random--';
      value = -1;
    }
    // Random value:
    if (gimmeValue) {
      category = '--random--';
      value = gimmeValue;
    }
    // Random category:
    if (gimmeCategory) {
      category = gimmeCategory;
      value = -1;
    }
    // We support some shorthands for clue selection:
    if (sameLowest) {
      category = '--same-lowest--';
      value = -1;
    }
    // If you want the same category for a given value:
    if (category === 'same' || category === 'same category') {
      category = '--same--';
    }

    const getClue = async () => {
      try {
        await this.game.newClue({
          contestant: this.contestant,
          category,
          value,
        });

        // We successfully got a clue:
        return true;
      } catch (e) {
        if (category === '--same-lowest--' && e.message.includes('value')) {
          this.say(`There are no clues left in that category. Giving you a random category instead...`);
          category = '--random--';
          value = -1;
          return await getClue();
        }

        if (e.message.includes('value')) {
          this.say(`I'm sorry, I can't give you a clue for that value.`);
        } else if (e.message.includes('category')) {
          this.say(`I'm sorry, I don't know what category that is. Try being more specific.`);
        } else if (e.message.includes('board control')) {
          this.say(`Wait to select a category, board control is active.`);
        } else {
          winston.info('Unexpected category selection error.', e);
        }

        // Don't continue:
        return false;
      }
    };

    const retrievedClue = await getClue();

    // If we didn't get a clue, bail out:
    if (!retrievedClue) {
      return;
    }

    const clue = this.game.getClue();

    // Give the user a little more feedback when we can:
    this.say(`OK, \`${this.game.getCategory().title}\` for ${currency(clue.value)}...`);

    // You found a daily double!
    if (this.studio.features.dailyDoubles && this.game.isDailyDouble()) {
      const dailyDoubleUrl = await dailydoubleImage();

      // Make sure that the daily double image displays before we do anything else:
      await this.say('Answer: Daily Double', dailyDoubleUrl);
      const channelScore = this.contestant.channelScore(this.data.channel_id).value;
      this.say(
        `Your score is ${currency(channelScore)}. ` +
        `What would you like to wager, <@${this.contestant.id}>? ` +
        `(max of ${currency(Math.max(channelScore, clue.value))}, min of $5)`
      );
      // TODO: Wager timeouts
    } else {
      try {
        const url = await clueImage(this.game);

        // Mark that we're sending the clue now:
        await this.game.clueSent();
        this.say(`Here's your clue.`, url);
      } catch (e) {
        // Revert the clue selection:
        await this.game.revertClue();
        this.say('We are having some issues creating the clue image. Please try again.');
        return;
      }

      // Additional feedback after we timeout:
      setTimeout(async () => {
        // Grab the lock so we block incoming requests:
        await this.lock();
        // Try to be safe and unlock even when we fail:
        try {
          // We need to refresh the document because it could be outdated:
          const game = await this.models.Game.forChannel({
            channel_id: this.game.channel_id,
          });
          if (game.isTimedOut()) {
            // Get the current clue:
            const currentClue = game.getClue();

            // We timed out, so mark this question as done.
            await game.answer();

            this.say(`Time's up! The correct answer was \`${currentClue.answer}\`.`);

            if (game.isComplete()) {
              const contestants = await this.channelContestants();
              this.say(await endgameMessage(game, contestants, this.data.channel_id));
            } else {
              const boardUrl = await boardImage(game);
              this.say(newClueMessage(game), boardUrl);
            }
          }
        } finally {
          this.unlock();
        }
      }, (this.studio.values.timeout * 1000) + 100);
    }
  }
}

export default Clue;
