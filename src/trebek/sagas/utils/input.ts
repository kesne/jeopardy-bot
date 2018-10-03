import { take, spawn } from 'redux-saga/effects';
import { INTENT } from '../../actionTypes';
import { SagaHandler } from '../../types';
import languageManager from '../../languageManager';

const SLOT_REGEX = /%(.*?)%/gi;

// NOTE: I'm not using a takeEvery here, because this handling allows us to implement locks super cleanly using fork instead of spawn
export default function* input(
    matchers: string | string[],
    handler: SagaHandler,
) {
    //Generate a random identifier:
    const intent =
        Math.random()
            .toString(36)
            .substring(2, 15) +
        Math.random()
            .toString(36)
            .substring(2, 15);
    const finalMatchers = Array.isArray(matchers) ? matchers : [matchers];

    finalMatchers.forEach(matcher => {
        const slots = matcher.match(SLOT_REGEX);
        if (slots) {
            slots.forEach(slot => {
                languageManager.slotManager.addSlot(
                    intent,
                    slot.replace('%', ''),
                    false,
                );
            });
        }

        languageManager.addDocument('en', matcher, intent);
    });

    // Re-train the model:
    languageManager.train();

    while (true) {
        const action = yield take(INTENT);
        if (action.intent.id === intent) {
            yield spawn(handler, action);
        }
    }
}
