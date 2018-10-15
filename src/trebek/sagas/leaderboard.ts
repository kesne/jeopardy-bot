import take from 'lodash/take';
import orderBy from 'lodash/orderBy';
import { input, say } from './utils';
import { selectContestants } from '../selectors';
import currency from '../helpers/currency';
import { Contestant } from '../../types';

const MAX_PLAYERS = 10;

export default function* leaderboard() {
    yield input(/(leaderboards?|loserboards?)( \d{1,2})?/, function*(
        action,
        [[match, num = MAX_PLAYERS]],
    ) {
        const leaders = match.includes('leader');
        const contestants: Contestant[] = yield selectContestants();
        const sortedOrderedContestants = take(
            orderBy(
                contestants.filter(
                    contestant =>
                        leaders
                            ? contestant.stats.money > 0
                            : contestant.stats.money < 0,
                ),
                'stats.money',
                leaders ? 'desc' : 'asc',
            ),
            Math.min(Number(num), MAX_PLAYERS),
        );

        if (sortedOrderedContestants.length === 0) {
            yield say(
                `There are no ${
                    leaders ? 'leaders' : 'losers'
                } yet. Get out there and play some games!`,
            );
        } else {
            const players = contestants.map((contestant, i) => {
                return (
                    `${i + 1}. <@${contestant.id}>:` +
                    `\n> _${currency(contestant.stats.money)}_ *|* _${
                        contestant.stats.won
                    } wins_ *|* _${contestant.stats.lost} losses_`
                );
            });

            yield say(
                `Let's take a look at the ${leaders ? 'top' : 'bottom'} ${
                    players.length
                } players:\n\n${players.join('\n')}`,
            );
        }
    });
}
