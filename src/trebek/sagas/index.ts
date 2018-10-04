import { all, setContext } from 'redux-saga/effects';
import poke from './poke';
import endGame from './endGame';
import newGame from './newGame';
import uptime from './uptime';
import greeting from './greeting';
import help from './help';
import clue from './clue';

// TODO: We really need to boot a saga per channel, and then put the studio on the context, rather the action.

export default function* rootSaga(manager) {
    yield setContext({
        manager,
    });

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
