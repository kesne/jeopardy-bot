import { createStore, applyMiddleware, Store } from 'redux';
import createSagaMiddleware, { Task, SagaMiddleware } from 'redux-saga';
import reducer from './reducers';
import sagas from './sagas';
import { INPUT, EVENT } from './actionTypes';
import { SlackMessage, SlackEvent, JeopardyImage } from '../types';

interface Message {
    id: string;
    message: string;
    image?: JeopardyImage;
    ephemeral?: string;
    attachments?: any[];
}
type SendMessage = (payload: Message) => any;
type AddReaction = (id: string, reaction: string, ts: string) => any;
type GetDisplayName = (id: string) => Promise<string>;
interface PersistenceLayer {
    persist(blob: string): Promise<void>;
    revive(): Promise<string>;
}

// Upload the state every 5 minutes:
const SYNC_INTERVAL = 5 * 60 * 1000;

export default class Trebek {
    private studios: Map<String, Task> = new Map();
    private persistence: PersistenceLayer;
    private saga?: SagaMiddleware<{}>;
    private store?: Store;

    public sendMessage: SendMessage;
    public getDisplayName: GetDisplayName;
    public addReaction: AddReaction;

    constructor({
        sendMessage,
        addReaction,
        getDisplayName,
        persistence,
    }: {
        sendMessage: SendMessage;
        addReaction: AddReaction;
        getDisplayName: GetDisplayName;
        persistence: PersistenceLayer;
    }) {
        this.sendMessage = sendMessage;
        this.addReaction = addReaction;
        this.getDisplayName = getDisplayName;
        this.persistence = persistence;
    }

    async start() {
        let initialState = undefined;
        try {
            const revivedState = await this.persistence.revive();
            initialState = JSON.parse(revivedState);
        } catch(e) {
            // Ignore failures:
            console.log('Revive failed.');
            console.log(e);
        }

        this.saga = createSagaMiddleware();
        this.store = createStore(reducer, initialState, applyMiddleware(this.saga));

        setInterval(() => {
            this.persistence.persist(JSON.stringify(this.store!.getState()));
        }, SYNC_INTERVAL);

        const persistThenExit = async () => {
            console.log('Detected app exit, attempting to persist the store state...');
            await this.persistence.persist(JSON.stringify(this.store!.getState()));
            console.log('Store state successfully persisted!');
            process.exit(0);
        };

        process.on('SIGINT', persistThenExit);
        process.on('SIGTERM', persistThenExit);
    }

    // Dynamically boot sagas based on events we get:
    ensureStudioExists(id: string) {
        if (!this.studios.has(id)) {
            const studioSaga = this.saga!.run(sagas, this, id);
            this.studios.set(id, studioSaga);
        }
    }

    input(message: SlackMessage) {
        this.ensureStudioExists(message.channel);

        this.store!.dispatch({
            type: INPUT,
            payload: {
                text: message.text,
                ts: message.ts,
            },
            contestant: message.user,
            studio: message.channel,
        });
    }

    event(eventName: string, event: SlackEvent) {
        // Only process events that have a corresponding channel and user:
        if (event.channel && event.user) {
            this.ensureStudioExists(event.channel);

            this.store!.dispatch({
                type: EVENT,
                payload: {
                    eventName,
                },
                contestant: event.user,
                studio: event.channel,
            });
        }
    }
}
