import { select, put } from 'redux-saga/effects';
import sample from 'lodash/sample';
import { DiceCoefficient } from 'natural';
import { input, requirement, Requirement, say } from './utils';
import { BaseAction } from '../../types';
import { ClueOptions, setCurrentQuestion } from '../actions/games';
import clean from '../helpers/clean';
import { Game } from '../reducers/games';

const VALUES = [200, 400, 600, 800, 1000];

function* newClue(
    category: string | ClueOptions,
    value: number,
    action: BaseAction,
) {
    const game: Game = yield select(({ games }) => games[action.studio.id]);

    let selectedCategory: number | undefined;

    if (
        (category === ClueOptions.SAME ||
            category === ClueOptions.SAME_LOWEST) &&
        game.recentCategory
    ) {
        selectedCategory = game.recentCategory;
    } else if (category === ClueOptions.RANDOM) {
        const randomQuestion = sample(game.questions.filter(
            question => !question.answered,
        ));
        selectedCategory = randomQuestion && randomQuestion.categoryId;
    } else {
        // Easier to match cleaned versions of our input:
        const cleanCategory = clean(category as string);
        const cc = game.categories
            .map(category => {
                return {
                    id: category.id,
                    rank: DiceCoefficient(clean(category.title), cleanCategory),
                };
            })
            .sort((a, b) => {
                if (a.rank > b.rank) {
                    return -1;
                } else if (b.rank > a.rank) {
                    return 1;
                }
                return 0;
            })
            .filter(x => {
                return x.rank > 0.4;
            })[0];

        // If we can extract a category from the input, let's use it:
        if (cc) {
            selectedCategory = cc.id;
        }
    }

    // // Invalid ask:
    // if (!selectedCategory) {
    //     throw new RangeError('category');
    // }

    // We use -1 internally to represent "lowest available value":
    if (value === -1) {
        // These questions are internally value-sorted lowest-to-highest.
        const lowestValueClue = game.questions.find(question => {
            return (
                question.categoryId === selectedCategory && !question.answered
            );
        });

        if (lowestValueClue) {
            value = lowestValueClue.value;
        }
    }

    if (!VALUES.includes(value)) {
        throw new RangeError('value');
    }

    const question = game.questions.find(q => {
        return q.categoryId === selectedCategory && q.value === value;
    });

    if (question.answered) {
        throw new Error('Question has already been answered.');
    }

    // TODO: Adjust to handle daily doubles:
    // // If the question is a daily double, add in the contestant:
    // if (question.dailyDouble) {
    //     this.dailyDouble.contestant = contestant.id;
    // }

    // Reset the guesses:
    yield put(
        setCurrentQuestion({
            id: action.studio.id,
            category: selectedCategory,
            question: question.id,
        }),
    );
}

// TODO: Respect board control:
function* clue(
    action: BaseAction,
    [
        [inputCategory, inputValue],
        [sameLowest],
        [gimme, gimmeValue, gimmeCategory],
    ]: string[][],
) {
    if (
        (yield requirement(Requirement.GAME_ACTIVE, action)) &&
        (yield requirement(Requirement.NO_CLUE, action))
    ) {
        let category: string | ClueOptions = inputCategory || gimmeCategory;
        let value = Number(inputValue);

        // Completely Random clue:
        if (gimme && !gimmeValue && !gimmeCategory) {
            category = ClueOptions.RANDOM;
            value = -1;
        }
        // Random value:
        if (gimmeValue) {
            category = ClueOptions.RANDOM;
            value = Number(gimmeValue);
        }
        // Random category:
        if (gimmeCategory) {
            category = gimmeCategory;
            value = -1;
        }
        // We support some shorthands for clue selection:
        if (sameLowest) {
            category = ClueOptions.SAME_LOWEST;
            value = -1;
        }
        // If you want the same category for a given value:
        if (category === 'same' || category === 'same category') {
            category = ClueOptions.SAME;
        }

        try {
            const clue = yield newClue(category, value, action);
            console.log(clue);
        } catch (e) {}

        // const getClue = async () => {
        //     try {
        //         await this.game.newClue({
        //             contestant: this.contestant,
        //             category,
        //             value,
        //         });

        //         // We successfully got a clue:
        //         return true;
        //     } catch (e) {
        //         if (
        //             category === '--same-lowest--' &&
        //             e.message.includes('value')
        //         ) {
        //             this.say(
        //                 `There are no clues left in that category. Giving you a random category instead...`,
        //             );
        //             category = '--random--';
        //             value = -1;
        //             return await getClue();
        //         }

        //         if (e.message.includes('value')) {
        //             this.say(
        //                 `I'm sorry, I can't give you a clue for that value.`,
        //             );
        //         } else if (e.message.includes('category')) {
        //             this.say(
        //                 `I'm sorry, I don't know what category that is. Try being more specific.`,
        //             );
        //         } else if (e.message.includes('board control')) {
        //             this.say(
        //                 `Wait to select a category, board control is active.`,
        //             );
        //         } else {
        //             winston.info('Unexpected category selection error.', e);
        //         }

        //         // Don't continue:
        //         return false;
        //     }
        // };

        // const retrievedClue = await getClue();

        // // If we didn't get a clue, bail out:
        // if (!retrievedClue) {
        //     return;
        // }

        // const clue = this.game.getClue();

        // // Give the user a little more feedback when we can:
        // yield say(
        //     `OK, \`${this.game.getCategory().title}\` for ${currency(
        //         clue.value,
        //     )}...`,
        // );
    }
}

export default function* watchClue() {
    yield input(
        [
            /(?:ill take |give me |choose )?(.*?) (?:for )?\$?(\d{3,4})(?: alex| trebek)?/,
            /(same)/,
            /(gimme)(?: for \$?(\d{3,4}))?(?: (.+?))?/,
        ],
        clue,
    );
}
