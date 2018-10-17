import { put } from 'redux-saga/effects';
import { input, requirement, say, Requirement } from './utils';
import { newGame } from '../actions/games';
import * as japi from '../../japi';
import selectClue from './clue/selectClue';

export default function* watchNewGame() {
    yield input(['new game', /new game (\d+)/], function* (action, [,[gameID]]) {
        if (yield requirement(Requirement.GAME_INACTIVE)) {
            yield say('Starting a new game for you...');

            const episode = yield japi.generateGame(gameID);
            const { clues: questions, categories } = episode.roundOne;
            yield put(
                newGame({
                    id: action.studio,
                    questions,
                    categories,
                }),
            );

            yield selectClue({ initial: true });
        } else {
            yield say(
                'There is already a game in progress! You must finish or end that game before starting a new game.',
            );
        }
    });
}
