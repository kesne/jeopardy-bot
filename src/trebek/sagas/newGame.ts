import { put } from 'redux-saga/effects';
import { input, requirement, say, Requirement } from './utils';
import * as gameActions from '../actions/games';
import { BaseAction } from '../../types';
import { generateGame } from '../../japi';
import selectClue from './clue/selectClue';

function* startNewGame(action: BaseAction) {
    if (yield requirement(Requirement.GAME_INACTIVE)) {
        yield say('Starting a new game for you...');

        const episode = yield generateGame();
        const { clues: questions, categories } = episode.roundOne;
        yield put(
            gameActions.newGame({
                id: action.studio,
                questions,
                categories,
            }),
        );

        yield selectClue(true);
    } else {
        yield say(
            'There is already a game in progress! You must finish or end that game before starting a new game.',
        );
    }
}

export default function* watchNewGame() {
    yield input('new game', startNewGame);
}
