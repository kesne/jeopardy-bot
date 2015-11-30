import Command from '../Command';
import { Trigger, Only, Feature, Provide, currency } from '../utils';
import { clueImage } from '../../cola';

@Trigger(
  /(?:(?:ill )?wager)?\s*\$?(\d{1,6})/
)
@Only(
  'gameactive',
  'mydailydouble'
)
@Feature(
  'dailyDoubles'
)
@Provide(
  'game',
  'contestant'
)
class Wager extends Command {
  async response([inputValue]) {
    let value = inputValue;
    // Value comes through as a string:
    value = parseInt(value, 10);

    // Validate the value of the wager:
    if (value < 5) {
      this.say('That wager is too low.');
      return;
    }

    const score = this.contestant.channelScore(this.data.channel_id).value;

    // Wager must be less than or equal to the value of the clue, or all of your money.
    const maxWager = Math.max(score, this.game.getClue().value);
    if (value > maxWager) {
      this.say('That wager is too high.');
      return;
    }

    // Stash the daily double wager:
    this.game.dailyDouble.wager = value;

    // Parallelize for better performance:
    const [url] = await Promise.all([
      clueImage({
        game: this.game,
      }),
      this.game.save(),
    ]);

    // TODO: Daily Double timeouts
    this.say(`For ${currency(value)}, here's your clue.`, url);
  }
}

export default Wager;
