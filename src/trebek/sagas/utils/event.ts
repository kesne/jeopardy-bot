import { takeEvery, spawn } from 'redux-saga/effects';
import { EVENT } from '../../actionTypes';
import { SagaHandler, BaseAction } from '../../types';

export default function* event(eventName: string, handler: SagaHandler) {
    yield takeEvery(EVENT, function*(action: BaseAction) {
        if (action.payload.event === eventName) {
            yield spawn(handler, action);
        }
    });
}
