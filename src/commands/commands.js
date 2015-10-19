import numeral from 'numeral';
import {Contestant} from '../models/Contestant';
import {Game} from '../models/Game';
import {getImageUrl} from '../upload';
import * as config from '../config';

const formatter = '$0,0';
const formatCurrency = value => {
  return numeral(value).format(formatter);
};

export function poke() {
  this.send(`I'm here, I'm here...`);
}

export function help() {
  this.send(`
Here, this should help you out!
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
    “leaderboard” - Shows the scores and wins from all games.`);
}

export async function leaderboard() {
  const contestants = await Contestant.find().sort({'stats.money': -1}).limit(5);
  if (contestants.length === 0) {
    this.send('There are no winners yet. Go out there and play some games!');
    return;
  }

  // Format the leaders:
  const leaders = contestants.map((contestant, i) => (
`${i + 1}. ${contestant.name}:
> _${formatCurrency(contestant.stats.money)}_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses_`
  ));

  this.send(`Let's take a look at the top 5 players:\n\n${leaders.join('\n')}`);
}

export async function scores({body}) {
  const leaders = await scoresMessage({body});

  if (!leaders) {
    this.send('There are no scores yet!');
    return;
  }

  await this.send('Here are the current scores for this game:');

  this.send(`\n\n${leaders}`);
}

export async function newgame({game, body}) {
  if (game && !game.isComplete()) {
    this.send('It looks like a game is already in progress! You need to finish or end that one first before starting a new game.');
    return;
  }

  this.sendOptional('Starting a new game for you...');

  // Start the game:
  await Game.start({
    channel_id: body.channel_id
  });
  const url = await getImageUrl({
    file: 'board',
    channel_id: body.channel_id
  });
  this.send(`Let's get this game started! Go ahead and select a category and value.`, url);
}

export async function endgame({game}) {
  if (!game) {
    this.send(`There's no game in progress. You can always start a new game by typing "new game".`);
    return;
  }
  // Try to end the game:
  await game.end();
  this.send(`Alright, I've ended that game for you. You can always start a new game by typing "new game".`);
}

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
    getImageUrl({
      file: 'clue',
      channel_id: body.channel_id
    }),
    game.save()
  ]);

  // TODO: Daily Double timeouts
  this.send(`For ${formatCurrency(value)}, here's your clue.`, url);
}

// TODO: Environment variable to enable challenges.
// TODO: Challenges are only available in hybrid mode.
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
    const [contestants] = await Promise.all([
      Contestant.find().where('scores').elemMatch({
        channel_id: body.channel_id
      }),
      game.startChallenge()
    ]);
    const challengeClue = game.questions.find(question => question.id === game.challenge.question);
    this.send(`A challenge has been called on the last question.\nI thought the correct answer was \`${challengeClue.answer}\`, and the guess was \`${game.challenge.guess}\`.`);
    this.send(`So @${contestants.join(', @')}, do you think they were right? Respond with just "y" or "n" to vote.`);

    setTimeout(async () => {
      await this.lock();
      try {
        await game.challengeEnd();
      } catch (e) {
        if (e.message.includes('min')) {
          this.send('The challenge failed. There were not enough votes. Carry on!');
        } else if (e.message.includes('votes')) {
          this.send('The challenge failed. Not enough people agreed. Carry on!');
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
        const url = await getImageUrl({
          file: 'board',
          channel_id: body.channel_id
        });
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
      game.answer({
        guess
      })
    ]);

    await this.send(`That is correct, ${contestant.name}. Your score is ${formatCurrency(contestant.channelScore(body.channel_id).value)}.`);

    if (game.isComplete()) {
      this.send(`${ await endGameMessage({game, body}) }`);
    } else {
      // Get the new board url:
      const url = await getImageUrl({
        file: 'board',
        channel_id: body.channel_id
      });
      this.send(`Select a new clue.`, url);
    }
  } else {
    await contestant.incorrect({
      value,
      channel_id: body.channel_id
    });
    this.send(`That is incorrect, ${contestant.name}. Your score is now ${formatCurrency(contestant.channelScore(body.channel_id).value)}.`);
    // If the clue is a daily double, the game progresses
    if (game.isDailyDouble()) {
      this.send(`The correct answer is \`${clue.answer}\`.`);
      // Mark answer as complete.
      await game.answer({
        guess
      });
      const url = await getImageUrl({
        file: 'board',
        channel_id: body.channel_id
      });
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
    if (e.message.includes('already active')) {
      this.send(`There's already an active clue. Wait your turn.`);
    } else if (e.message.includes('value')) {
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

  // You found a daily double!
  if (game.isDailyDouble()) {
    const dailyDoubleUrl = await getImageUrl({
      file: 'dailydouble',
      channel_id: body.channel_id
    });

    // Make sure that the daily double image displays before we do anything else:
    await this.send('Answer: Daily Double', dailyDoubleUrl);
    this.send(`What would you like to wager, ${contestant.name}?`);
    // TODO: Wager timeouts
  } else {
    // Give the user a little more feedback when we can:
    this.sendOptional(`OK, \`${game.getCategory().title}\` for ${formatCurrency(clue.value)}...`);

    const url = await getImageUrl({
      file: 'clue',
      channel_id: body.channel_id
    });
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
              const url = await getImageUrl({
                file: 'board',
                channel_id: body.channel_id
              });
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
