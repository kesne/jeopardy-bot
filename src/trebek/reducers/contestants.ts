import produce from 'immer';
import { BaseAction } from '../../types';
import { ADJUST_SCORE, CREATE_CONTESTANT, END_GAME } from '../actionTypes';

// TODO: We need to somehow get the name updated at some interval. Right now,
// the name is set one and never updated, which isn't ideal as people can change
// their display name. We could fairly easily do this by storing a `lastUpdated`
// timestamp and re-loading the display name at some interval.
// Another option would be to not store the name at all, and instead load it
// on-demand as we need it. There are only a few features that require us to
// be able to make non-pinging mentions, and we could just special-case those.
interface Contestant {
    id: string;

    // The last name that we saw for them (for non-pinging references).
    name: string;

    // The current scores for contestants in a given channel.
    scores: {
        [channel: string]: number;
    };

    stats: {
        // Aggregate of all of the money won/lost from all games.
        money: number;
        // Number of games won:
        won: number;
        // Number of games lost:
        lost: number;
    };
}

interface State {
    [key: string]: Contestant;
}

const initialState = {} as State;

export default produce<State, BaseAction>((draft, action) => {
    switch (action.type) {
        case CREATE_CONTESTANT:
            draft[action.contestant] = {
                id: action.contestant,
                name: action.payload.name,
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
                if (contestant.scores[action.payload.id]) {
                    contestant.stats.money += contestant.scores[action.payload.id];
                    if (action.payload.winner) {
                        if (action.payload.winner === contestant.id) {
                            contestant.stats.won += 1;
                        } else {
                            contestant.stats.lost += 1;
                        }
                    }
                    delete contestant.scores[action.payload.id];
                }
            });
            break;
    }
}, initialState);
