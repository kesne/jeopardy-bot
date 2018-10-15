import dedent from 'dedent';
import { input, say } from './utils';

const helpText = dedent`
    Here, this should help you out!
    >>>*Games*
        “help” - Displays this helpful message.
        “new game” - Starts a new game.
        “end game” - Ends the current game.
    *Selecting Categories*
        “I’ll take ________ for $___”
        “Give me ________ for $___”
        “Choose ________ for $___”
        “________ for $___”
        “Same (category) for $___”
        “Gimme ________”
    *Guessing*
        “What [is|are] _______”
        “Who [is|are] ________”
        “Where [is|are] ______”
        “When [is|are] ______”
    *Wagering*
        “(I'll) wager $___”
        “$___”
    *Scores*
        “scores” - Shows the scores for the current game.
        “leaderboard” - Shows the scores for the top players.
        “loserboard” - Shows the scores for the bottom players.
    *Configuration*
        “config” - Shows the configuration for the current channel
        “config global” - Shows the global configuration
`;

export default function* help() {
    yield input('help', function*(action) {
        yield say(helpText, {
            ephemeral: action.contestant,
        });
    });
}
