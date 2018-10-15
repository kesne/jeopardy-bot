import { delay } from 'redux-saga';
import { race, put, getContext } from 'redux-saga/effects';
import sample from 'lodash/sample';
import clean from '../../helpers/clean';
import { input, say, react } from '../utils';
import selectClue from './selectClue';
import { markQuestionAnswered } from '../../actions/games';
import { adjustScore } from '../../actions/contestants';
import currency from '../../helpers/currency';
import guessMatches from '../../helpers/guessMatches';
import { selectStudioScore } from '../../selectors';
import { Clue } from '../../../types';

function* guessAnswer(clue: Clue) {
    // Keep track of people that have already guessed on this clue:
    let guessed: Set<string> = new Set();

    // We accept partial answers, as well as the complete answer:
    const answers = clue.answer
        .split(/\(|\)/)
        .filter(n => n)
        .map(answer => clean(answer));
    answers.push(answers.join(' '));

    while (true) {
        const { action, matches } = yield input([
            /(?:whats?|wheres?|whos?|whens?) (?:(?:is|are|was|were|the|an?) ){1,2}(.*)/,
            /w (.*)/,
        ]);

        if (guessed.has(action.contestant)) {
            yield react(
                sample(['speak_no_evil', 'no_good', 'no_mouth']) as string,
                action,
            );
            yield say(
                `You had your chance, <@${
                    action.contestant
                }>. Let someone else answer.`,
            );
            continue;
        }

        // Support both the guess shorthand and
        const guess = matches[0][0] || matches[1][0];

        const correctAnswer = answers.some(answer =>
            guessMatches(guess, answer),
        );

        if (!correctAnswer) {
            guessed.add(action.contestant);

            yield put(
                adjustScore({
                    contestant: action.contestant,
                    studio: action.studio,
                    amount: -1 * clue.value,
                }),
            );

            const score = yield selectStudioScore(action.studio, action.contestant);

            yield react('x', action);
            yield say(
                `That is incorrect, <@${
                    action.contestant
                }>. Your score is now ${currency(score)}.`,
            );
        } else {
            yield put(
                adjustScore({
                    contestant: action.contestant,
                    studio: action.studio,
                    amount: clue.value,
                }),
            );

            const score = yield selectStudioScore(action.studio, action.contestant);

            yield react('white_check_mark', action);
            yield say(
                `That is correct, <@${action.contestant}>. The answer was \`${
                    clue.answer
                }\`.\nYour score is now ${currency(score)}.`,
            );

            return action.contestant;
        }
    }
}

// Clues are active for 30 seconds:
// const DELAY_AMOUNT = 30;
const DELAY_AMOUNT = 10;

export default function* guess(clue: Clue) {
    const { contestant, timeout } = yield race({
        // TODO: Daily doubles don't time out.
        // TODO: Allow configuring delay:
        timeout: delay(DELAY_AMOUNT * 1000),
        contestant: guessAnswer(clue),
    });

    yield put(
        markQuestionAnswered({
            id: yield getContext('studio'),
            question: clue.id,
            contestant,
        }),
    );

    if (timeout) {
        yield say(`Time's up! The correct answer was \`${clue.answer}\`.`);
    }

    // Prompt selection of a new clue:
    yield selectClue();
}
