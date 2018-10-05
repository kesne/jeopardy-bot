import {
    NumberRecognizer,
    Culture as NumberCulture,
} from '@microsoft/recognizers-text-number';
import {
    DateTimeRecognizer,
    Culture as DateCulture,
} from '@microsoft/recognizers-text-date-time';
import { delay } from 'redux-saga';
import { race, select } from 'redux-saga/effects';
import isEqual from 'lodash/isEqual';
import { DiceCoefficient, JaroWinklerDistance } from 'natural';
import { Clue } from '../../reducers/games';
import clean from '../../helpers/clean';
import { input, say } from '../utils';
import selectClue from './selectClue';

// Constants for answer similarity:
export const ACCEPTED_SIMILARITY = 0.6;
export const JARO_SIMILARITY = 0.9;
export const JARO_GUARDRAIL = 0.5;

var numberRecognizer = new NumberRecognizer(NumberCulture.English);
var dateRecognizer = new DateTimeRecognizer(DateCulture.English);
var numberParser = numberRecognizer.getNumberModel();
var dateParser = dateRecognizer.getDateTimeModel();

function numbersEqual(input1: string, input2: string) {
    const numbers1 = numberParser
        .parse(input1)
        .map(({ resolution }) => resolution);
    const numbers2 = numberParser
        .parse(input2)
        .map(({ resolution }) => resolution);

    return numbers1.length && isEqual(numbers1, numbers2);
}

function datesEqual(input1: string, input2: string) {
    const dates1 = dateParser.parse(input1).map(({ resolution }) => resolution);
    const dates2 = dateParser.parse(input2).map(({ resolution }) => resolution);

    return dates1.length && isEqual(dates1, dates2);
}

function stringsEqual(input1: string, input2: string) {
    const similarity = DiceCoefficient(input1, input2);
    if (similarity >= ACCEPTED_SIMILARITY) {
        return true;
    }
    // Sometimes the Dice Coefficient is bad at matching, so we have a guardrail
    // set to check the similarity with a different algorithm when there is some level of similarity.
    if (similarity >= JARO_GUARDRAIL) {
        const jaroSimilarity = JaroWinklerDistance(input1, input2);
        return jaroSimilarity >= JARO_SIMILARITY;
    }

    return false;
}

function* guessAnswer(clue: Clue) {
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

        const hasGuessed = yield select(
            ({ games }) => games[action.studio].guessed[action.contestant],
        );

        if (hasGuessed) {
            // TODO: Add the no-speaking emoji as a response:
            yield say(
                `You had your chance, <@${
                    action.contestant
                }>. Let someone else answer.`,
            );
            continue;
        }

        // Support both the guess shorthand and
        const guess = matches[0][0] || matches[1][0];

        console.log(guess);

        const correctAnswer = answers.some(answer => {
            // Number matching:
            return (
                guess === answer ||
                numbersEqual(guess, answer) ||
                datesEqual(guess, answer) ||
                stringsEqual(guess, answer)
            );
        });

        if (!correctAnswer) {
            // TODO: Add this to guesses
            // TODO: Track score.
            yield say(`That is incorrect, <@${action.contestant}>.`);
        } else {
            // TODO: Award the value and mark the question as answered.
            yield say(
                `That is correct, <@${action.contestant}>. The answer was \`${
                    clue.answer
                }\`.`,
            );

            // Prompt selection of a new clue:
            yield selectClue();

            return;
        }
    }
}

// Clues are active for 30 seconds:
// const DELAY_AMOUNT = 30;
const DELAY_AMOUNT = 10;

export default function* guess(clue) {
    const { answer, timeout } = yield race({
        // TODO: Daily doubles don't time out.
        // TODO: Allow configuring delay:
        timeout: delay(DELAY_AMOUNT * 1000),
        answer: guessAnswer(clue),
    });

    if (timeout) {
        yield say(`Time's up! The correct answer was \`${clue.answer}\`.`);
    }
}
