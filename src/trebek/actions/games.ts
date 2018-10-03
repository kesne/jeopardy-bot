import { NEW_GAME, END_GAME } from "../actionTypes";

interface GameOptions {
    id: string;
}

export function newGame({ id }: GameOptions) {
    return {
        type: NEW_GAME,
        payload: {
            id,
        }
    }
}

export function endGame({ id }: GameOptions) {
    return {
        type: END_GAME,
        payload: {
            id,
        }
    }
}
