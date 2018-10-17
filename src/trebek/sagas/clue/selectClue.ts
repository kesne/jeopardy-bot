import { say, feature } from '../utils';
import { boardImage } from '../../../images';
import { getContext } from 'redux-saga/effects';
import { selectGame, selectStudio } from '../../selectors';
import { Studio, Game } from '../../../types';

export default function* selectClue({
    initial = false,
    contestant = null,
} = {}) {
    const studioId = yield getContext('studio');
    const studio: Studio = yield selectStudio(studioId);
    const game: Game = yield selectGame(studioId);
    const image = yield boardImage(game);

    if (initial) {
        yield say(
            "Let's get this game started! Go ahead and select a category and value.",
            { image },
        );
    } else if (contestant && (yield feature('boardControl'))) {
        yield say(
            `Select a new clue. <@${contestant}>, you have control of the board for ${
                studio.timeouts.boardControl
            } seconds.`,
            { image },
        );
    } else {
        yield say('Select a new clue.', { image });
    }
}
