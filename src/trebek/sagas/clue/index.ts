import { input, requirement, Requirement, say, feature } from '../utils';
import { ClueWithCategory, Studio } from '../../../types';
import { ClueOptions } from '../../actions/games';
import currency from '../../helpers/currency';
import newClue from './newClue';
import guess from './guess';
import wager from './wager';
import { clueImage, dailyDoubleImage } from '../../../images';
import { spawn } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { selectStudio } from '../../selectors';

function getCategory(category: string | ClueOptions) {
    if (category === 'same' || category === 'same category') {
        return ClueOptions.SAME;
    }

    return category;
}

function getValue(inputValue?: string, gimmeValue?: string) {
    const value = Number(inputValue || gimmeValue);
    return Number.isNaN(value) ? -1 : value;
}

export default function* clue() {
    let lastContestant: string | null = null;
    let lastContestantThread: any = null;

    yield input(
        [
            /(?:ill take |give me |choose )?(.*?) (?:for )?\$?(\d{3,4})(?: alex| trebek)?/,
            /(same)/,
            /(gimme)(?: for \$?(\d{3,4}))?(?: (.+?))?/,
        ],
        function*(
            action,
            [
                [inputCategory, inputValue],
                [sameLowest],
                [gimme, gimmeValue, gimmeCategory],
            ],
        ) {
            if (yield requirement(Requirement.GAME_ACTIVE)) {
                if (yield feature('dailyDoubles') && lastContestant && lastContestant !== action.contestant) {
                    yield say('Wait to select a category, board control is active.');
                    return;
                }

                if (lastContestantThread) {
                    lastContestantThread.cancel();
                }

                let category: string | ClueOptions = sameLowest
                    ? ClueOptions.SAME_LOWEST
                    : getCategory(
                          inputCategory || gimmeCategory || ClueOptions.RANDOM,
                      );

                let value =
                    sameLowest || gimmeCategory || (gimme && !gimmeValue)
                        ? -1
                        : getValue(inputValue, gimmeValue);

                const clue: ClueWithCategory = yield newClue(
                    category,
                    value,
                    action,
                );

                // Bail if we were unable to get a clue:
                if (!clue) return;

                // Give the user a little more feedback when we can:
                yield say(
                    `OK, \`${clue.category.title}\` for ${currency(
                        clue.value,
                    )}...`,
                );

                let dailyDoubleWager = null;
                if (clue.dailyDouble && (yield feature('dailyDoubles'))) {
                    const image = yield dailyDoubleImage();
                    yield say('Answer: Daily Double', { image });

                    dailyDoubleWager = yield wager(action, clue);
                }

                const image = yield clueImage(clue);

                if (dailyDoubleWager) {
                    yield say(
                        `For ${currency(dailyDoubleWager)}, here's your clue.`,
                        { image },
                    );
                } else {
                    yield say("Here's your clue.", { image });
                }

                // TODO: Turn video clues into gifs:
                if (clue.media.length && (yield feature('clueMedia'))) {
                    yield say('Here is the media for the clue.', {
                        attachments: clue.media.map(url => ({
                            title: 'Clue Media',
                            image_url: url,
                        })),
                    });
                }

                lastContestant = yield guess(action, clue, dailyDoubleWager);
                if (lastContestant && (yield feature('boardControl'))) {
                    const studio: Studio = yield selectStudio(action.studio);
                    lastContestantThread = yield spawn(function* () {
                        yield delay(studio.timeouts.boardControl * 1000);
                        yield say('Board control has ended, anyone can now select a clue!');
                        lastContestant = null;
                    });
                }
            }
        },
    );
}
