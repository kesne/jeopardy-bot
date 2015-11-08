import moment from 'moment';
import numeral from 'numeral';
import {Contestant} from '../models/Contestant';
import {Game} from '../models/Game';
import {boardImage, clueImage, dailydoubleImage, captureCluesForGame} from '../cola';
import * as config from '../config';

export async function guess({game, contestant, body, guess}) {
  // Cache the clue reference:
  const clue = game.getClue();

  // Daily doubles don't timeout:
  if (!clue.dailyDouble) {
    const guessDate = parseInt(body.timestamp, 10) * 1000;
    if (moment(guessDate).isBefore(moment(game.questionStart))) {
      // We guessed before the question was fully posted:
      return;
    }
  }

  let correct;
  try {
    correct = await game.guess({
      guess,
      contestant
    });
  } catch (e) {
    // Timeout:
    if (e.message.includes('timeout')) {
      // We timed out, so mark this question as done.
      await game.answer();

      await this.send(`Time's up, ${contestant.name}! Remember, you have ${config.CLUE_TIMEOUT} seconds to answer. The correct answer is \`${clue.answer}\`.`);

      if (game.isComplete()) {
        this.send(`${ await endGameMessage({game, body}) }`);
      } else {
        const url = await boardImage({game});
        this.send(`Select a new clue.`, url);
      }
    } else if (e.message.includes('contestant')) {
      this.send(`You had your chance, ${contestant.name}. Let someone else answer.`);
    } else if (e.message.includes('wager')) {
      this.send('You need to make a wager before you guess.');
    }

    console.log('Error occured', e);

    // Just ignore guesses if they're outside of the game context:
    return;
  }

  // Extract the value from the current clue:
  let {value} = clue;

  // Daily doubles have a different value:
  if (game.isDailyDouble()) {
    value = game.dailyDouble.wager;
  }

  if (correct) {
    await Promise.all([
      // Award the value:
      contestant.correct({
        value,
        channel_id: body.channel_id
      }),
      // Mark the question as answered:
      game.answer()
    ]);

    await this.send(`That is correct, ${contestant.name}. Your score is ${formatCurrency(contestant.channelScore(body.channel_id).value)}.`);

    if (game.isComplete()) {
      this.send(`${ await endGameMessage({game, body}) }`);
    } else {
      // Get the new board url:
      const url = await boardImage({game});
      this.send(`Select a new clue.`, url);
    }
  } else {
    await contestant.incorrect({
      value,
      channel_id: body.channel_id
    });
    await this.send(`That is incorrect, ${contestant.name}. Your score is now ${formatCurrency(contestant.channelScore(body.channel_id).value)}.`);
    // If the clue is a daily double, the game progresses
    if (game.isDailyDouble()) {
      this.send(`The correct answer is \`${clue.answer}\`.`);
      // Mark answer as complete.
      await game.answer();
      const url = await boardImage({game});
      this.send('Select a new clue.', url);
    }
  }
}

export async function category({game, contestant, body, category, value}) {
  
}

async function scoresMessage({body}) {
  const contestants = await Contestant.find().where('scores').elemMatch({
    channel_id: body.channel_id
  });
  return contestants.sort((a, b) => {
    const {value: aScore} = a.channelScore(body.channel_id);
    const {value: bScore} = b.channelScore(body.channel_id);
    if (bScore > aScore) {
      return 1;
    }
    if (aScore > bScore) {
      return -1;
    }
    return 0;
  }).map((contestant, i) => (
    `${i + 1}. ${contestant.name}: ${formatCurrency(contestant.channelScore(body.channel_id).value)}`
  )).join('\n');
}

async function endGameMessage({body, game}) {
  let str = `\nAnd that's it for this round of Jeopardy. Let's take a look at the final scores...\n\n`;
  str += `\`\`\`${ await scoresMessage({body}) }\`\`\``;
  str += `\n\nThanks for playing! You can always start another game by typing "new game".`;

  // End the game:
  await game.end();

  return str;
}
