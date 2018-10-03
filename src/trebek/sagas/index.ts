import { all } from 'redux-saga/effects';
import poke from './poke';
import endGame from './endGame';
import newGame from './newGame';
import uptime from './uptime';
import greeting from './greeting';
import help from './help';
import clue from './clue';

export default function* rootSaga() {
    // Install all of the features:
    yield all([
        poke(),
        newGame(),
        endGame(),
        uptime(),
        greeting(),
        help(),
        clue(),
    ]);
}
