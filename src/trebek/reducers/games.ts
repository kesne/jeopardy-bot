import produce from 'immer';
import { NEW_GAME, END_GAME, MARK_QUESTION_ANSWERED } from '../actionTypes';
import { BaseAction, ReduxState } from '../../types';

type State = ReduxState['games'];
const initialState: State = {};

export default produce<State, BaseAction>((draft, action) => {
    switch (action.type) {
        case NEW_GAME:
            draft[action.payload.id] = {
                recentCategory: undefined,
                categories: action.payload.categories,
                questions: action.payload.questions,
            };
            break;
        case END_GAME:
            delete draft[action.payload.id];
            break;
        case MARK_QUESTION_ANSWERED: {
            const question = draft[action.payload.id].questions.find(({ id }) => id === action.payload.question);
            if (question) {
                question.answered = true;
                draft[action.payload.id].recentCategory = question.categoryId;
            }
            break;
        }
    }
}, initialState);
