import { take, getContext, put } from 'redux-saga/effects';
import { INPUT } from '../../actionTypes';
import { BaseAction } from '../../../types';
import clean from '../../helpers/clean';
import { createContestant } from '../../actions/contestants';
import { selectContestant, selectStudio } from '../../selectors';

type Handler = (action: BaseAction, matches: string[][]) => void;
interface Options {
    ignoreEnabled?: boolean;
}

export default function* input(
    matchers: string | RegExp | (string | RegExp)[],
    handler?: Handler,
    options?: Options
) {
    const finalMatchers: RegExp[] = (Array.isArray(matchers)
        ? matchers
        : [matchers]
    ).map(pattern => {
        let fullMessage = pattern;
        if (pattern instanceof RegExp) {
            fullMessage = pattern.source;
        }

        return new RegExp(`^${fullMessage}$`, 'i');
    });

    const studio = yield getContext('studio');

    while (true) {
        const action = yield take(INPUT);

        // Ensure this is related to us:
        if (action.studio !== studio) continue;

        // Ensure the studio is actaully enabled:
        if (!options || !options.ignoreEnabled) {
            const { enabled } = yield selectStudio(studio);
            if (!enabled) continue;
        }

        let valid = false;
        const matches = finalMatchers.map(trigger => {
            const m = trigger.exec(clean(action.payload.text));

            if (m !== null) {
                valid = true;
            }

            return m ? m.slice(1) : [];
        });

        if (valid) {
            const contestant = yield selectContestant(action.contestant);
            if (!contestant) {
                yield put(createContestant(action.contestant));
            }

            // If there is no handler, then we treat this as a returned input:
            if (handler) {
                yield handler(action, matches);
            } else {
                return { action, matches };
            }
        }
    }
}
