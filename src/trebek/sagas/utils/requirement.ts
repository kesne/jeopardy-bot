import { select, getContext } from 'redux-saga/effects';

export enum Requirement {
    GAME_ACTIVE,
    GAME_INACTIVE,
}

export default function* requirement(type: Requirement) {
    if (type === Requirement.GAME_INACTIVE || type === Requirement.GAME_ACTIVE) {
        const studio = yield getContext('studio');
        const game = yield select(({ games }) => games[studio]);

        const hasActiveGame = !!game;

        return type === Requirement.GAME_ACTIVE
            ? hasActiveGame
            : !hasActiveGame;
    }

    // Default everything to requirement not met:
    return false;
}
