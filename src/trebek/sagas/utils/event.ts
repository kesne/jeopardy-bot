import { takeEvery, spawn, getContext } from 'redux-saga/effects';
import { EVENT } from '../../actionTypes';
import { BaseAction } from '../../../types';
import { selectStudio } from '../../selectors';

type Handler = (action: BaseAction) => void;

export default function* event(eventName: string, handler: Handler) {
    yield takeEvery(EVENT, function*(action: BaseAction) {
        const studio = yield getContext('studio');

        // Ensure the studio is actaully enabled:
        const { enabled } = yield selectStudio(studio);
        if (!enabled) return;

        if (action.payload.eventName === eventName && action.studio === studio) {
            yield spawn(handler, action);
        }
    });
}
