import {Command, Trigger, Needs, Only} from './trebek';

@Trigger(
  /(?:(?:ill )?wager)?\s*\$?(\d{1,6})/
)
@Needs(
  'game',
  'contestant',
  'contestants'
)
@Only(
  'mydailydouble'
)
export class Wager extends Command {
  async response([value]) {
    this.wager = value;
  }
}

@Trigger(
  'poke'
)
export class Poke extends Command {
  async response() {
    this.say(`I'm here, I'm here...`);
  }
}

// Instead of doing complex tokenizing and such, let's just clean all punctuation on input in and out:
// Trim the string and convert all multiple spaces to single spaces (so that we can do simple whitespace matches isntead of huge ones)
@Trigger(
  /(?:whats?|wheres?|whos?|whens?) (?:(?:is|are|was|were|the|an?) ){1,2}(.*)/
)
@Needs(
  'game',
  'contestant',
  'contestants'
)
@Only(
  'gameactive'
)
export class Guess extends Command {

}
