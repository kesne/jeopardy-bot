import moment from 'moment';
import numeral from 'numeral';
import {Contestant} from '../models/Contestant';
import {Game} from '../models/Game';
import {boardImage, clueImage, dailydoubleImage, captureCluesForGame} from '../cola';
import * as config from '../config';

const formatter = '$0,0';
const formatCurrency = value => {
  return numeral(value).format(formatter);
};

// For daily doubles:
export async function wager({game, contestant, body, value}) {
  // Sanity check (this function is easy to trigger accidently):
  if (!game || !game.isDailyDouble() || game.dailyDouble.contestant !== contestant.slackid || game.dailyDouble.wager) {
    return;
  }
  // Validate the value of the wager:
  if (value < 5) {
    this.send('That wager is too low.');
    return;
  }
  // Wager must be less than or equal to the value of the clue, or all of your money.
  if (value > contestant.channelScore(body.channel_id).value && value > game.getClue().value) {
    this.send('That wager is too high.');
    return;
  }

  // Stash the daily double wager:
  game.dailyDouble.wager = value;

  // Parallelize for better performance:
  const [url] = await Promise.all([
    clueImage({game}),
    game.save()
  ]);

  // TODO: Daily Double timeouts
  this.send(`For ${formatCurrency(value)}, here's your clue.`, url);
}

// TODO: Environment variable to enable challenges.
// TODO: Challenges are only available in hybrid mode. Make sure that's documented and set.
export async function challenge({game, contestant, body, correct, start}) {
  if (!start && game.isChallengeStarted()) {
    // Register the vote if we haven't already voted:
    const hasVoted = game.challenge.votes.some(vote => vote.contestant === contestant.slackid);
    if (!hasVoted) {
      game.challenge.votes.push({
        contestant: contestant.slackid,
        correct
      });
      await game.save();
    }
  } else if (start && !game.isChallengeStarted()) {
    const [contestants, {guess, answer}] = await Promise.all([
      Contestant.find().where('scores').elemMatch({
        channel_id: body.channel_id
      }),
      game.startChallenge({contestant})
    ]);
    const contestantString = contestants.map(contestant => `@${contestant.name}`).join(', ');
    this.send(`A challenge has been called on the last question.\nI thought the correct answer was \`${answer}\`, and the guess was \`${guess}\`.`);
    this.send(`${contestantString}, do you think they were right? Respond with just "y" or "n" to vote.`);

    setTimeout(async () => {
      await this.lock();
      // We need to refresh the document because it could be outdated:
      game = await Game.forChannel({
        channel_id: game.channel_id
      });
      try {
        const {channelScore} = await game.endChallenge();
        this.send(`Congrats, ${contestant.name}, your challenge has succeeded. Your score is now ${formatCurrency(channelScore.value)}.`);
      } catch (e) {
        if (e.message.includes('min')) {
          this.send('The challenge failed. There were not enough votes. Carry on!');
        } else if (e.message.includes('votes')) {
          this.send('The challenge failed. Not enough people agreed. Carry on!');
        } else {
          console.log('Unknown challenge error...', e);
        }
      } finally {
        this.unlock();
      }
    }, (config.CHALLENGE_TIMEOUT + 1) * 1000);
  }
}

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
  try {
    await game.newClue({
      contestant: contestant.slackid,
      category,
      value
    });
  } catch (e) {
    if (e.message.includes('value')) {
      this.send(`I'm sorry, I can't give you a clue for that value.`);
    } else if (e.message.includes('category')) {
      this.send(`I'm sorry, I don't know what category that is. Try being more specific.`);
    } else {
      console.log('Unexpected category selection error.', e);
    }
    // Just ignore it:
    return;
  }

  const clue = game.getClue();

  // Give the user a little more feedback when we can:
  this.sendOptional(`OK, \`${game.getCategory().title}\` for ${formatCurrency(clue.value)}...`);

  // You found a daily double!
  if (game.isDailyDouble()) {
    const dailyDoubleUrl = await dailydoubleImage();

    // Make sure that the daily double image displays before we do anything else:
    await this.send('Answer: Daily Double', dailyDoubleUrl);
    const channelScore = contestant.channelScore(body.channel_id).value;
    this.send(`Your score is ${formatCurrency(channelScore)}. What would you like to wager, @${contestant.name}? (max of ${formatCurrency(Math.max(channelScore, clue.value))}, min of $5)`);
    // TODO: Wager timeouts
  } else {
    const url = await clueImage({game});

    // Mark that we're sending the clue now:
    await game.clueSent();
    this.send(`Here's your clue.`, url);

    // Additional feedback after we timeout (plus five seconds for some flexibility):
    if (config.MODE !== 'response') {
      setTimeout(async () => {
        // Grab the lock so we block incoming requests:
        await this.lock();
        // We need to refresh the document because it could be outdated:
        game = await Game.forChannel({
          channel_id: game.channel_id
        });
        // Try to be safe and unlock even when we fail:
        try {
          if (game.isTimedOut()) {
            // Get the current clue:
            const clue = game.getClue();

            // We timed out, so mark this question as done.
            await game.answer();

            this.sendOptional(`Time's up! The correct answer is \`${clue.answer}\`.`);

            if (game.isComplete()) {
              this.sendOptional(await endGameMessage({game, body}));
            } else {
              const url = await boardImage({game});
              this.sendOptional('Select a new clue.', url);
            }
          }
        } finally {
          this.unlock();
        }
      }, (config.CLUE_TIMEOUT + 1) * 1000);
    }
  }
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
