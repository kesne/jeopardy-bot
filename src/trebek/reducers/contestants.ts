import produce from 'immer';
import { BaseAction, ReduxState } from '../../types';
import { ADJUST_SCORE, CREATE_CONTESTANT, END_GAME } from '../actionTypes';

type State = ReduxState['contestants'];
const initialState: State = {};

export default produce<State, BaseAction>((draft, action) => {
    switch (action.type) {
        case CREATE_CONTESTANT:
            draft[action.contestant] = {
                id: action.contestant,
                scores: {},
                stats: {
                    money: 0,
                    won: 0,
                    lost: 0,
                },
            };
            break;
        case ADJUST_SCORE:
            draft[action.contestant].scores[action.studio] =
                (draft[action.contestant].scores[action.studio] || 0) +
                action.payload.amount;
            break;
        case END_GAME:
            Object.values(draft).forEach((contestant) => {
                if (contestant.scores[action.studio]) {
                    contestant.stats.money += contestant.scores[action.studio];
                    if (action.payload.winner) {
                        if (action.payload.winner === contestant.id) {
                            contestant.stats.won += 1;
                        } else {
                            contestant.stats.lost += 1;
                        }
                    }
                    delete contestant.scores[action.studio];
                }
            });
            break;
    }
}, initialState);
