import moment from 'moment';
import Command from '../Command';
import { Trigger, Only, Provide, currency } from '../utils';
import endgameMessage from './shared/endgame';
import newClueMessage from './shared/newclue';
import { boardImage } from '../../cola';
import winston from 'winston';

@Trigger(
  /(?:whats?|wheres?|whos?|whens?) (?:(?:is|are|was|were|the|an?) ){1,2}(.*)/,
  /w (.*)/
)
@Provide(
  'game',
  'channelContestants',
  'contestant',
)
@Only(
  'gameactive',
  'clue'
)
class Guess extends Command {
  async response([inputGuess], [shorthandGuess]) {
    let guess = inputGuess;
    // Support the new guess shorthand:
    if (shorthandGuess) {
      guess = shorthandGuess;
    }

    // Cache the clue reference:
    const clue = this.game.getClue();

    // Daily doubles don't timeout:
    if (!clue.dailyDouble || !this.studio.features.dailyDoubles) {
      const guessDate = parseInt(this.data.timestamp, 10) * 1000;
      if (moment(guessDate).isBefore(moment(this.game.questionStart))) {
        // We guessed before the question was fully posted:
        return;
      }
    }

    let correct;
    try {
      correct = await this.game.guess({
        guess,
        contestant: this.contestant,
      });
    } catch (e) {
      // Timeout:
      if (e.message.includes('timeout')) {
        // Ignore this message because we're always in bot mode now, and the timeout handles this.
      } else if (e.message.includes('contestant')) {
        this.say(`You had your chance, ${this.contestant.name}. Let someone else answer.`);
        if (this.studio.features.guessReactions) {
          const possibleEmojis = ['speak_no_evil', 'no_good', 'no_mouth'];
          const randIndex = Math.floor(Math.random() * possibleEmojis.length);
          const reaction = possibleEmojis[randIndex];
          this.addReaction(reaction);
        }
      } else if (e.message.includes('wager')) {
        this.say('You need to make a wager before you guess.');
      }

      winston.error('Guess error occured', e);

      // Just ignore guesses if they're outside of the game context:
      return;
    }

    // Extract the value from the current clue:
    let { value } = clue;

    // Daily doubles have a different value:
    if (this.game.isDailyDouble()) {
      value = this.game.dailyDouble.wager;
    }

    if (correct) {
      await Promise.all([
        // Award the value:
        this.contestant.correct({
          value,
          channel_id: this.data.channel_id,
        }),
        // Mark the question as answered:
        this.game.answer(this.contestant),
      ]);

      await this.say(`That is correct, ${this.contestant.name}. The answer was \`${clue.answer}\`.\nYour score is now ${currency(this.contestant.channelScore(this.data.channel_id).value)}.`);

      if (this.studio.features.guessReactions) {
        this.addReaction('white_check_mark');
      }

      if (this.game.isComplete()) {
        const contestants = await this.channelContestants();
        this.say(`${ await endgameMessage(this.game, contestants, this.data.channel_id) }`);
      } else {
        // Get the new board url:
        const url = await boardImage(this.game);
        this.say(newClueMessage(this.game), url);
      }
    } else {
      await this.contestant.incorrect({
        value,
        channel_id: this.data.channel_id,
      });

      await this.say(`That is incorrect, ${this.contestant.name}. Your score is now ${currency(this.contestant.channelScore(this.data.channel_id).value)}.`);

      if (this.studio.features.guessReactions) {
        this.addReaction('x');
      }

      // If the clue is a daily double, the game progresses
      if (this.game.isDailyDouble()) {
        await Promise.all([
          this.game.answer(),
          this.say(`The correct answer is \`${clue.answer}\`.`),
        ]);

        if (this.game.isComplete()) {
          const contestants = await this.channelContestants();
          this.say(`${ await endgameMessage(this.game, contestants, this.data.channel_id) }`);
        } else {
          // Get the new board url:
          const url = await boardImage(this.game);
          this.say(newClueMessage(this.game), url);
        }
      }
    }
  }
}

export default Guess;
