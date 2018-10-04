import { input, requirement, Requirement, say } from '../utils';
import { BaseAction } from '../../../types';
import { ClueOptions } from '../../actions/games';
import currency from '../../helpers/currency';
import newClue from './newClue';
import guess from './guess';

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
        (yield requirement(Requirement.GAME_ACTIVE))
    ) {
        let category: string | ClueOptions = sameLowest
            ? ClueOptions.SAME_LOWEST
            : getCategory(inputCategory || gimmeCategory || ClueOptions.RANDOM);

        let value =
            sameLowest || gimmeCategory || (gimme && !gimmeValue)
                ? -1
                : getValue(inputValue, gimmeValue);

        const clue = yield newClue(category, value, action);

        // Bail if we were unable to get a clue:
        if (!clue) return;

        // // Give the user a little more feedback when we can:
        yield say(
            `OK, \`${clue.category.title}\` for ${currency(clue.value)}...`,
        );

        yield guess(clue);
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
