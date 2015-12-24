import Command from '../Command';
import { NoLock, Trigger, currency } from '../utils';

const MAX_PLAYERS = 10;

@NoLock
@Trigger(
  /(leaderboards?|loserboards?)( \d{1,2})?/
)
export default class LeaderLosers extends Command {
  async response([leaderloser, num = MAX_PLAYERS]) {
    const leaders = leaderloser.includes('leader');
    const contestants = await this.models.Contestant.find({
      'stats.money': {
        [leaders ? '$gt' : '$lt']: 0,
      },
    }).sort({
      'stats.money': leaders ? -1 : 1,
    }).limit(num);

    if (contestants.length === 0) {
      this.say(`There are no ${leaders ? 'leaders' : 'losers'} yet. Get out there and play some games!`);
    } else {
      const players = contestants.map((contestant, i) => {
        return `${i + 1}. ${contestant.nonMentionedName}:` +
        `\n> _${currency(contestant.stats.money)}_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses_`;
      });
      this.say(
        `Let's take a look at the ${leaders ? 'top' : 'bottom'} ${players.length} players:\n\n${players.join('\n')}`
      );
    }
  }
}
