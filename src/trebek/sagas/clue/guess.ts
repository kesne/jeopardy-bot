import { delay } from 'redux-saga';
import { race, put } from 'redux-saga/effects';
import sample from 'lodash/sample';
import clean from '../../helpers/clean';
import { input, say, react } from '../utils';
import selectClue from './selectClue';
import { markQuestionAnswered } from '../../actions/games';
import { adjustScore } from '../../actions/contestants';
import currency from '../../helpers/currency';
import guessMatches from '../../helpers/guessMatches';
import { selectStudioScore, selectStudio } from '../../selectors';
import { Clue, Studio, BaseAction } from '../../../types';

function* guessAnswer(rootAction: BaseAction, clue: Clue, wager: number) {
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

        // If there's a wager, this is a daily double, and the only person that
        // can guess is the contestant that selected it:
        if (wager && rootAction.contestant !== action.contestant) {
            yield say(
                `This daily double is not for you, <@${action.contestant}>!`,
            );
            continue;
        }

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

        const value = wager || clue.value;

        if (!correctAnswer) {
            guessed.add(action.contestant);

            yield put(
                adjustScore({
                    contestant: action.contestant,
                    studio: action.studio,
                    amount: -1 * value,
                }),
            );

            const score = yield selectStudioScore(
                action.studio,
                action.contestant,
            );

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
                    amount: value,
                }),
            );

            const score = yield selectStudioScore(
                action.studio,
                action.contestant,
            );

            yield react('white_check_mark', action);
            yield say(
                `That is correct, <@${action.contestant}>. The answer was \`${
                    clue.answer
                }\`.\nYour score is now ${currency(score)}.`,
            );

            return action.contestant;
        }

        // If there is a wager then we can only process one guess:
        if (wager) {
            return;
        }
    }
}

export default function* guess(action: BaseAction, clue: Clue, wager: number) {
    const studio: Studio = yield selectStudio(action.studio);

    const { contestant, timeout } = yield race({
        timeout: delay(studio.timeouts.clue * 1000, true),
        contestant: guessAnswer(action, clue, wager),
    });

    yield put(
        markQuestionAnswered({
            id: action.studio,
            question: clue.id,
            contestant,
        }),
    );

    if (timeout) {
        yield say(`Time's up! The correct answer was \`${clue.answer}\`.`);

        if (wager) {
            yield put(
                adjustScore({
                    contestant: action.contestant,
                    studio: action.studio,
                    amount: -1 * wager,
                }),
            );

            const score = yield selectStudioScore(
                action.studio,
                action.contestant,
            );

            yield say(
                `You didn't guess in time, <@${
                    action.contestant
                }>, and your wager of ${currency(
                    wager,
                )} was deducted. Your score is now ${currency(score)}.`,
            );
        }
    }

    // Prompt selection of a new clue:
    yield selectClue({ contestant });

    return contestant;
}
