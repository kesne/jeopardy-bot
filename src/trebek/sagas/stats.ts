import dedent from 'dedent';
import { input, say } from './utils';
import { selectContestant } from '../selectors';
import currency from '../helpers/currency';

export default function* stats() {
    yield input(/stats?(?: ([A-Z0-9.\-_]+))?/, function*(action, [[id]]) {
        if (!id) return;
        const contestant = yield selectContestant(id);
        const score = contestant.scores[action.studio];

        yield say(dedent`
            Stats for *<@${id}>*:
            > _${currency(
                score,
            )} current game_ *|* _${currency(contestant.stats.money)} total_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses_
        `);
    });
}
