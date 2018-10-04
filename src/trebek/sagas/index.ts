import { all, setContext } from 'redux-saga/effects';
import poke from './poke';
import endGame from './endGame';
import newGame from './newGame';
import uptime from './uptime';
import greeting from './greeting';
import help from './help';
import clue from './clue';
import Trebek from '../';

export default function* rootSaga(manager: Trebek, studio: string) {
    yield setContext({
        manager,
        studio,
    });

    // TODO: Set up the studio in the redux store.

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
