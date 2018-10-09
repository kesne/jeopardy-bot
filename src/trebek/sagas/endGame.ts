import { input, say, requirement, Requirement } from './utils';
import * as gameActions from '../actions/games';
import { put, race } from 'redux-saga/effects';
import { BaseAction } from '../../types';
import { delay } from 'redux-saga';

const AFFIRMATIVE = ['yes', 'sure', 'yep', 'y', 'yeah'];

function* endGame(action: BaseAction) {
    if (yield requirement(Requirement.GAME_ACTIVE)) {
        yield say('Are you sure that you want to end the game?');

        const { confirm, timeout } = yield race({
            confirm: input(/(.*)/),
            timeout: delay(5000),
        });

        if (timeout) return;

        const response = confirm.matches[0][0];
        if (!AFFIRMATIVE.includes(response)) {
            yield say(
                "Okay, I won't end the game just yet!",
            );
            return;
        }

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
