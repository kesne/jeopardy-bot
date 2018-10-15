import { BaseAction, Game } from '../../../types';
import { ClueOptions } from '../../actions/games';
import sample from 'lodash/sample';
import clean from '../../helpers/clean';
import { DiceCoefficient } from 'natural';
import { say } from '../utils';
import { VALUES } from '../../../constants';
import { selectGame } from '../../selectors';

export default function* newClue(
    category: string | ClueOptions,
    value: number,
    action: BaseAction,
): any {
    const game: Game = yield selectGame(action.studio);

    let selectedCategory: null | number = null;

    if (
        (category === ClueOptions.SAME ||
            category === ClueOptions.SAME_LOWEST) &&
        game.recentCategory
    ) {
        selectedCategory = game.recentCategory;
    } else if (category === ClueOptions.RANDOM) {
        const randomQuestion = sample(
            game.questions.filter(question => !question.answered),
        );

        if (randomQuestion) {
            selectedCategory = randomQuestion.categoryId;
        }
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

    if (selectedCategory === null) {
        yield say(
            `I'm sorry, I don't know what category that is. Try being more specific.`,
        );
        return;
    }

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
        if (category === ClueOptions.SAME_LOWEST) {
            yield say(
                'There are no clues left in that category. Giving you a random category instead...',
            );

            return yield newClue(ClueOptions.RANDOM, -1, action);
        } else {
            yield say("I'm sorry, I can't give you a clue for that value.");
            return;
        }
    }

    const question = game.questions.find(q => {
        return q.categoryId === selectedCategory && q.value === value;
    });

    if (!question) {
        yield say(
            "I'm sorry, I wasn't able to find that clue. Please select another one.",
        );
        return;
    }

    if (question.answered) {
        yield say(
            "I'm sorry, that question has already been answered. Please select another one.",
        );
        return;
    }

    return {
        ...question,
        category: game.categories.find(({ id }) => id === selectedCategory),
    };
}
