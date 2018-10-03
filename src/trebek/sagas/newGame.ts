import { put } from 'redux-saga/effects';
import { input, requirement, say, Requirement } from './utils';
import * as gameActions from '../actions/games';
import { BaseAction } from '../types';

function* startNewGame(action: BaseAction) {
    if (yield requirement(Requirement.GAME_INACTIVE, action)) {
        yield say('Starting a new game for you...');
        yield put(
            gameActions.newGame({
                id: action.studio.id,
            }),
        );

        // TODO: Generate board image and pass it here:

        yield say(
            "Let's get this game started! Go ahead and select a category and value.",
        );
    } else {
        yield say(
            'There is already a game in progress! You must finish or end that game before starting a new game.',
        );
    }
}

export default function* watchNewGame() {
    yield input('new game', startNewGame);
}
