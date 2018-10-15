import { say, input, Requirement, requirement } from './utils';
import { selectChannelContestants } from '../selectors';
import currency from '../helpers/currency';
import { Contestant } from '../../types';

export default function* scores() {
    yield input(/scores?/, function*(action) {
        if (yield requirement(Requirement.GAME_ACTIVE)) {
            const contestants: Contestant[] = yield selectChannelContestants(
                action.studio,
            );

            if (!contestants.length) {
                yield say('There are no scores yet!');
                return;
            }

            const leaders = contestants
                .sort((a, b) => {
                    if (b.scores[action.studio] > a.scores[action.studio]) {
                        return 1;
                    }
                    if (a.scores[action.studio] > b.scores[action.studio]) {
                        return -1;
                    }
                    return 0;
                })
                .map(
                    (contestant, i) =>
                        `${i + 1}. <@${contestant.id}>: ${currency(
                            contestant.scores[action.studio],
                        )}`,
                )
                .join('\n');

            yield say('Here are the current scores for this game:');

            yield say(`\n\n${leaders}`);
        } else {
            yield say(
                'There is no current game. You can always start a new game by typing "*new game*".',
            );
        }
    });
}
