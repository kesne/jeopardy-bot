import Command from '../Command';
import {Trigger, Provide, NoLock, currency} from '../utils';

const MAX_LOSERS = 10;

@NoLock
@Trigger('loserboard')
@Provide('contestants')
export default class Loserboard extends Command {
  async response() {
    const contestants = await this.contestants.find({
      'stats.money': {
        $lt: 0
      }
    }).sort({
      'stats.money': 1
    }).limit(MAX_LOSERS);

    if (contestants.length === 0) {
      this.say('There are no losers yet. Get out there and play some games!');
    } else {
      const leaders = contestants.map((contestant, i) => {
        return `${i + 1}. ${contestant.nonMentionedName}:` +
        `\n> _${currency(contestant.stats.money)}_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses_`;
      });
      this.say(
        `Let's take a look at the bottom ${leaders.length} players:\n\n${leaders.join('\n')}`
      );
    }
  }
}
