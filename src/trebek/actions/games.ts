import { NEW_GAME, END_GAME, SET_CURRENT_QUESTION } from '../actionTypes';
import { Category, Clue } from '../reducers/games';

export enum ClueOptions {
    SAME,
    SAME_LOWEST,
    RANDOM,
}

export function newGame({
    id,
    questions,
    categories,
}: {
    id: string;
    questions: Clue[];
    categories: Category[];
}) {
    return {
        type: NEW_GAME,
        payload: {
            id,
            questions,
            categories,
        },
    };
}

export function endGame({ id }: { id: string }) {
    return {
        type: END_GAME,
        payload: {
            id,
        },
    };
}

export function setCurrentQuestion({
    id,
    category,
    question,
}: {
    id: string;
    category: number;
    question: number;
}) {
    return {
        type: SET_CURRENT_QUESTION,
        payload: {
            id,
            category,
            question,
        },
    };
}
