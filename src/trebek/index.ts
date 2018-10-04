import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga'
import reducer from './reducers';
import sagas from './sagas';
import { INPUT } from './actionTypes';

const sagaMiddleware = createSagaMiddleware();

// mount it on the Store
const store = createStore(reducer, applyMiddleware(sagaMiddleware));


export default class Trebek {
    constructor() {
        sagaMiddleware.run(sagas, this);
    }

    input(message) {
        store.dispatch({
            type: INPUT,
            payload: {
                text: message.text,
            },
            contestant: {
                id: message.user,
            },
            studio: {
                id: message.channel,
            }
        })
    }

    say(cb) {
        this._say = cb;
    }

    sendMessage(message: string, id: string) {
        this._say(message, id);
    }
}
