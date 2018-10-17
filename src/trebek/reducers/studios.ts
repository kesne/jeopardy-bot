import produce from 'immer';
import { BaseAction, ReduxState, Studio } from '../../types';
import { CREATE_STUDIO, END_GAME, TOGGLE_FEATURE, SET_ENABLED, SET_TIMEOUT } from '../actionTypes';

type State = ReduxState['studios'];
const initialState: State = {};

export default produce<State, BaseAction>((draft, action) => {
    switch (action.type) {
        case CREATE_STUDIO:
            draft[action.studio] = {
                id: action.studio,
                enabled: action.payload.enabled,
                timeouts: {
                    clue: 30,
                    challenge: 15,
                    wager: 10,
                    boardControl: 5,
                },
                features: {
                    challenges: true,
                    boardControl: true,
                    dailyDoubles: true,
                    greetings: true,
                    clueMedia: true,
                },
                stats: {
                    games: 0,
                    guesses: 0,
                },
            };
            break;

        case SET_ENABLED:
            draft[action.studio].enabled = action.payload.enabled;
            break;

        case SET_TIMEOUT:
            const timeout = action.payload.timeout as keyof Studio['timeouts'];
            draft[action.studio].timeouts[timeout] = action.payload.value;
            break;

        case TOGGLE_FEATURE:
            const feature = action.payload.feature as keyof Studio['features'];
            draft[action.studio].features[feature] = action.payload.enabled;
            break;

        case END_GAME:
            draft[action.studio].stats.games += 1;
            break;
    }
}, initialState);
