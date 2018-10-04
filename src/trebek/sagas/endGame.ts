import { input, say, requirement, Requirement } from './utils';
import * as gameActions from '../actions/games';
import { put } from 'redux-saga/effects';
import { BaseAction } from '../../types';

function* endGame(action: BaseAction) {
    if (yield requirement(Requirement.GAME_ACTIVE)) {
        yield put(
            gameActions.endGame({
                id: action.studio,
            }),
        );
        yield say(
            'Alright, I\'ve ended that game for you. You can always start a new game by typing "*new game*".',
        );
    } else {
        yield say(
            'There is currently no active game. You can start a new game by typing "*new game*".',
        );
    }
}

export default function* watchEndGame() {
    yield input('end game', endGame);
}
