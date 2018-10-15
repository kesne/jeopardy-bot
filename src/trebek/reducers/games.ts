import produce from 'immer';
import { NEW_GAME, END_GAME, MARK_QUESTION_ANSWERED } from '../actionTypes';
import { BaseAction, ReduxState } from '../../types';

type State = ReduxState['games'];
const initialState: State = {};

export default produce<State, BaseAction>((draft, action) => {
    switch (action.type) {
        case NEW_GAME:
            draft[action.studio] = {
                recentCategory: undefined,
                categories: action.payload.categories,
                questions: action.payload.questions,
            };
            break;
        case END_GAME:
            delete draft[action.studio];
            break;
        case MARK_QUESTION_ANSWERED: {
            const question = draft[action.studio].questions.find(({ id }) => id === action.payload.question);
            if (question) {
                question.answered = true;
                draft[action.studio].recentCategory = question.categoryId;
            }
            break;
        }
    }
}, initialState);
