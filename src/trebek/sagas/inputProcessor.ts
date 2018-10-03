import { takeEvery, put } from 'redux-saga/effects';
import { INPUT, INTENT } from '../actionTypes';
import languageManager from '../languageManager';
import { BaseAction } from '../types';

export default function* inputProcessor() {
    yield takeEvery(INPUT, function* process(action: BaseAction) {
        const result = yield languageManager.process(action.payload.text);
        if (result.classification) {
            yield put({
                ...action,
                type: INTENT,
                intent: {
                    id: result.intent,
                    entities: result.entities,
                },
            });
        }
    });
}
