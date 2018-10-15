import dedent from 'dedent';
import { input, say } from './utils';
import { selectContestant } from '../selectors';
import currency from '../helpers/currency';

export default function* stats() {
    yield input([/stats?\s+<@(.*)>/], function*(action, [[id]]) {
        if (!id) return;
        const contestant = yield selectContestant(id.toUpperCase());
        if (!contestant) {
            yield say("Hmm, I'm not quite sure who that is. It looks like they haven't played any games.");
            return;
        };

        const score = contestant.scores[action.studio];

        yield say(dedent`
            Stats for <@${id.toUpperCase()}>:
            > _${currency(
                score,
            )} current game_ *|* _${currency(contestant.stats.money)} total_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses_
        `);
    });
}
