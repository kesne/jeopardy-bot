import { getContext } from 'redux-saga/effects';
import { BaseAction } from '../../../types';

export default function* react(reaction: string, action: BaseAction) {
    if (action.payload.ts) {
        const studio = yield getContext('studio');
        const manager = yield getContext('manager');

        // NOTE: We intentionally don't yield this because we don't care about
        // waiting for the reaction response to complete:
        manager.addReaction(studio, reaction, action.payload.ts);
    }
}
