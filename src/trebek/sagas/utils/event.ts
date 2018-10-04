import { takeEvery, spawn, setContext, getContext } from 'redux-saga/effects';
import { EVENT } from '../../actionTypes';
import { BaseAction } from '../../../types';

type Handler = (action: BaseAction) => void;

export default function* event(eventName: string, handler: Handler) {
    yield takeEvery(EVENT, function*(action: BaseAction) {
        const studio = yield getContext('studio');
        if (action.payload.eventName === eventName && action.studio === studio) {
            yield spawn(handler, action);
        }
    });
}
