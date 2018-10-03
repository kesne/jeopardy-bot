import { input } from './utils';

function* clue(action) {

}

'(ill take|give me|choose)? [any](*) for? ';

export default function* watchClue() {
    yield input([
        /(?:ill take |give me |choose )?(.*?) (?:for )?\$?(\d{3,4})(?: alex| trebek)?/,
        /(same)/,
        /(gimme)(?: for \$?(\d{3,4}))?(?: (.+?))?/,
    ], clue);
}
