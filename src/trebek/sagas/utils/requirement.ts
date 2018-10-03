import { take, select } from 'redux-saga/effects';
import { BaseAction } from '../../../types';

export enum Requirement {
    GAME_ACTIVE,
    GAME_INACTIVE,
    NO_CLUE,
}

export default function* requirement(type: Requirement, action: BaseAction) {
    if (type === Requirement.GAME_INACTIVE || type === Requirement.GAME_ACTIVE) {
        const games = yield select(({ games }) => games);

        const hasActiveGame = !!games[action.studio.id];

        return type === Requirement.GAME_ACTIVE
            ? hasActiveGame
            : !hasActiveGame;
    }

    if (type === Requirement.NO_CLUE) {
        const game = yield select(({ games }) => games[action.studio.id]);
        return !game.currentQuestion;
    }

    // Default everything to requirement not met:
    return false;
}
