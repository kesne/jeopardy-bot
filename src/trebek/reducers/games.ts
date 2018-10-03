import produce from 'immer';
import { NEW_GAME, END_GAME } from '../actionTypes';
import { BaseAction } from '../types';

interface State {
    [key: string]: {};
}

const initialState: State = {};

export default produce<State, BaseAction>((draft, action) => {
    switch (action.type) {
        case NEW_GAME:
            draft[action.payload.id] = {};
            break;
        case END_GAME:
            delete draft[action.payload.id];
            break;
    }
}, initialState);
