import produce from 'immer';
import { NEW_GAME, END_GAME, SET_CURRENT_QUESTION } from '../actionTypes';
import { BaseAction } from '../../types';

export interface Clue {
    id: number;
    categoryId: number;
    question: string;
    answer: string;
    value: number;
    dailyDouble: boolean;
    answered: boolean;
}

export interface Category {
    id: number;
    title: string;
}

export interface Game {
    questions: Clue[],
    categories: Category[],
    recentCategory?: number;
    currentQuestion?: number;
}

interface State {
    [key: string]: Game;
}

const initialState: State = {};

export default produce<State, BaseAction>((draft, action) => {
    switch (action.type) {
        case NEW_GAME:
            draft[action.payload.id] = {
                recentCategory: undefined,
                currentQuestion: undefined,
                categories: action.payload.categories,
                questions: action.payload.questions,
            };
            break;
        case END_GAME:
            delete draft[action.payload.id];
            break;
        case SET_CURRENT_QUESTION:
            draft[action.payload.id].recentCategory = action.payload.category;
            draft[action.payload.id].currentQuestion = action.payload.question;
    }
}, initialState);
