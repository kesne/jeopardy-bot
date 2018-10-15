import { getContext } from 'redux-saga/effects';
import { selectGame } from '../../selectors';

export enum Requirement {
    GAME_ACTIVE,
    GAME_INACTIVE,
}

export default function* requirement(type: Requirement) {
    if (type === Requirement.GAME_INACTIVE || type === Requirement.GAME_ACTIVE) {
        const studio = yield getContext('studio');
        const game = yield selectGame(studio);

        const hasActiveGame = !!game;

        return type === Requirement.GAME_ACTIVE
            ? hasActiveGame
            : !hasActiveGame;
    }

    // Default everything to requirement not met:
    return false;
}
