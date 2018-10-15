import { all, setContext, cancel, spawn } from 'redux-saga/effects';
import Trebek from '../';
import poke from './poke';
import endGame from './endGame';
import newGame from './newGame';
import uptime from './uptime';
import greeting from './greeting';
import help from './help';
import clue from './clue';
import leaderboard from './leaderboard';
import stats from './stats';
import scores from './scores';
import config from './config';

export default function* rootSaga(manager: Trebek, studio: string) {
    yield setContext({
        manager,
        studio,
    });

    // TODO: Set up the studio in the redux store.

    // The current clue can be abandoned if the game is ended, so we need to
    // spawn it so that we can cancel in the future.
    let currentClue = yield spawn(clue);
    function* endClue() {
        yield cancel(currentClue);
        currentClue = yield spawn(clue);
    }

    // Install all of the features:
    yield all([
        poke(),
        newGame(),
        endGame(endClue),
        uptime(),
        greeting(),
        help(),
        leaderboard(),
        stats(),
        scores(),
        config(),
    ]);
}
