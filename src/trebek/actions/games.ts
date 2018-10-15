import { NEW_GAME, END_GAME, MARK_QUESTION_ANSWERED } from '../actionTypes';
import { Category, Clue } from '../../types';

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
        studio: id,
        payload: {
            questions,
            categories,
        },
    };
}

export function endGame({ id, winner }: { id: string; winner?: string }) {
    return {
        type: END_GAME,
        studio: id,
        payload: {
            winner,
        },
    };
}

export function markQuestionAnswered({
    id,
    question,
    contestant,
}: {
    id: string;
    question: number;
    contestant?: string;
}) {
    return {
        type: MARK_QUESTION_ANSWERED,
        studio: id,
        contestant,
        payload: {
            question,
        },
    };
}
