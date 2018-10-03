import { all } from 'redux-saga/effects';
import inputProcessor from './inputProcessor';
import poke from './poke';
import endGame from './endGame';
import newGame from './newGame';
import uptime from './uptime';
import greeting from './greeting';
import help from './help';

export default function* rootSaga() {
    // Install all of the features:
    yield all([inputProcessor(), poke(), newGame(), endGame(), uptime(), greeting(), help()]);
}
