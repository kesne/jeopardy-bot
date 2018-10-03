import { takeEvery, spawn } from 'redux-saga/effects';
import { EVENT } from '../../actionTypes';
import { BaseAction } from '../../../types';

type Handler = (action: BaseAction) => void;

export default function* event(eventName: string, handler: Handler) {
    yield takeEvery(EVENT, function*(action: BaseAction) {
        if (action.payload.event === eventName) {
            yield spawn(handler, action);
        }
    });
}
