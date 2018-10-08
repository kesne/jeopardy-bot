import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware, { Task } from 'redux-saga';
import reducer from './reducers';
import sagas from './sagas';
import { INPUT, EVENT } from './actionTypes';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducer, applyMiddleware(sagaMiddleware));

type SendMessage = (id: string, message: string) => any;
type GetDisplayName = (id: string) => Promise<string>;

export default class Trebek {
    studios: Map<String, Task> = new Map();

    public sendMessage: SendMessage;
    public getDisplayName: GetDisplayName;

    constructor({
        sendMessage,
        getDisplayName,
    }: {
        sendMessage: SendMessage;
        getDisplayName: GetDisplayName;
    }) {
        this.sendMessage = sendMessage;
        this.getDisplayName = getDisplayName;
    }

    // Dynamically boot sagas based on events we get:
    ensureStudioExists(id: string) {
        // TODO: Create studio in Redux:
        if (!this.studios.has(id)) {
            const studioSaga = sagaMiddleware.run(sagas, this, id);
            this.studios.set(id, studioSaga);
        }
    }

    input(message) {
        this.ensureStudioExists(message.channel);

        store.dispatch({
            type: INPUT,
            payload: {
                text: message.text,
            },
            contestant: message.user,
            studio: message.channel,
        });
    }

    event(eventName: string, event) {
        // Only process events that have a corresponding channel and user:
        if (event.channel && event.user) {
            this.ensureStudioExists(event.channel);

            store.dispatch({
                type: EVENT,
                payload: {
                    eventName,
                },
                contestant: event.user,
                studio: event.channel,
            });
        }
    }

    say(id: string, message: string) {
        this.sendMessage(id, message);
    }
}
