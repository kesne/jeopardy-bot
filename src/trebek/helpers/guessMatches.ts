import {
    NumberRecognizer,
    Culture as NumberCulture,
} from '@microsoft/recognizers-text-number';
import {
    DateTimeRecognizer,
    Culture as DateCulture,
} from '@microsoft/recognizers-text-date-time';
import { DiceCoefficient, JaroWinklerDistance } from 'natural';
import isEqual from 'lodash/isEqual';

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

    return !!numbers1.length && isEqual(numbers1, numbers2);
}

function datesEqual(input1: string, input2: string) {
    const dates1 = dateParser.parse(input1).map(({ resolution }) => resolution);
    const dates2 = dateParser.parse(input2).map(({ resolution }) => resolution);

    return !!dates1.length && isEqual(dates1, dates2);
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

export default function guessMatches(guess: string, answer: string): boolean {
    return (
        guess === answer ||
        stringsEqual(guess, answer) ||
        numbersEqual(guess, answer) ||
        datesEqual(guess, answer)
    );
}
