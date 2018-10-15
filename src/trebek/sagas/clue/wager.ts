import { input, say } from '../utils';
import { selectStudioScore, selectStudio } from '../../selectors';
import { Clue, BaseAction, Studio } from '../../../types';
import { race } from 'redux-saga/effects';
import currency from '../../helpers/currency';
import { delay } from '@slack/client/dist/util';

function* wagerInput(rootAction: BaseAction, clue: Clue) {
    while (true) {
        const {
            action,
            matches: [[inputValue]],
        } = yield input(/(?:(?:ill )?wager)?\s*\$?(\d{1,6})/);

        if (action.contestant !== rootAction.contestant) {
            continue;
        }

        const value = parseInt(inputValue, 10);

        // Validate the value of the wager:
        if (value < 5) {
            yield say('That wager is too low.');
            continue;
        }

        const studioScore = yield selectStudioScore(action.studio, action.contestant);
        const maxWager = Math.max(studioScore, clue.value);
        if (value > maxWager) {
            yield say('That wager is too high.');
            continue;
        }

        yield say(`Got it, wagering ${currency(value)}...`);

        return value;
    }
}

export default function* wager(action: BaseAction, clue: Clue) {
    const studioScore = yield selectStudioScore(action.studio, action.contestant);

    yield say(
        `Your score is ${currency(studioScore)}. ` +
        `What would you like to wager, <@${action.contestant}>? ` +
        `(max of ${currency(Math.max(studioScore, clue.value))}, min of $5)`
    );

    const studio: Studio = yield selectStudio(action.studio);

    const { input, timeout } = yield race({
        timeout: delay(studio.timeouts.wager * 1000, true),
        input: wagerInput(action, clue),
    });

    if (timeout) {
        yield say(`Oh no, <@${action.contestant}>, you ran out of time to wager. The clue is now open for everyone!`);
    }

    return input;
}
