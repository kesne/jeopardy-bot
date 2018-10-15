import { select } from 'redux-saga/effects';
import { ReduxState } from '../types';

export function selectConfig() {
    return select(({ config }: ReduxState) => config);
}

export function selectStudio(studio: string) {
    return select(({ studios }: ReduxState) => studios[studio]);
}

export function selectContestants() {
    return select(({ contestants }: ReduxState) => Object.values(contestants));
}

export function selectContestant(contestant: string) {
    return select(({ contestants }: ReduxState) => contestants[contestant]);
}

export function selectChannelContestants(studio: string) {
    return select(({ contestants }: ReduxState) =>
        Object.values(contestants).filter(contestant =>
            contestant.scores.hasOwnProperty(studio),
        ),
    );
}

export function selectStudioScore(studio: string, contestant: string) {
    return select(
        ({ contestants }: ReduxState) => contestants[contestant].scores[studio] || 0,
    );
}

export function selectGame(studio: string) {
    return select(({ games }: ReduxState) => games[studio]);
}
