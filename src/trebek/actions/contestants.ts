import { ADJUST_SCORE, CREATE_CONTESTANT } from '../actionTypes';

export function createContestant(contestant: string, name: string) {
    return {
        type: CREATE_CONTESTANT,
        payload: {
            name,
        },
        contestant,
    }
}

export function adjustScore({
    contestant,
    studio,
    amount,
}: {
    contestant: string;
    studio: string;
    amount: number;
}) {
    return {
        type: ADJUST_SCORE,
        payload: {
            amount,
        },
        contestant,
        studio,
    };
}
