import Command from '../Command';
import {Trigger} from '../utils';

@Trigger('help')
class Help extends Command {
  response() {
    this.say(
`Here, this should help you out!
>>>*Games*
    “help” - Displays this helpful message.
    “new game” - Starts a new game.
    “end game” - Ends the current game.
*Selecting Categories*
    “I’ll take ________ for $___”
    “Give me ________ for $___”
    “Choose ________ for $___”
    “ ________ for $___”
    “Same (category) for $___”
*Guessing*
    “What [is|are] _______”
    “Who [is|are] ________”
    “Where [is|are] ______”
*Wagering*
    “$___”
*Scores*
    “scores” - Shows the score for the current game.
    “leaderboard” - Shows the scores and wins from all games.`
    );
  }
}

export default Help;
