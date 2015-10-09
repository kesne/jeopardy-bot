import numeral from 'numeral';
import {Contestant} from '../models/Contestant';
import {Game} from '../models/Game';
import {getImageUrl} from '../upload';
import responses from './responses';
import * as config from '../config';

// TODO: Make top-level formatter to simplify some code down below.
const formatter = '$0,0';

export const poke = () => {
  return `I'm here, I'm here...`;
};

export const help = () => {
  return responses.help;
};

export async function leaderboard() {
  const contestants = await Contestant.find().sort({'stats.money': -1}).limit(5);
  if (contestants.length === 0) {
    return 'There are no winners yet. Go out there and play some games!';
  }
  const leaders = contestants.map((contestant, i) => {
    return (
`${i + 1}. ${contestant.name}:
> _${numeral(contestant.stats.money).format(formatter)}_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses_`
    );
  });
  return `Let's take a look at the top 5 players:\n\n${leaders.join('\n')}`;
}

export async function scores({body, showHeader = true}) {
  const contestants = await Contestant.find().where('scores').elemMatch({
    channel_id: body.channel_id
  });
  if (contestants.length === 0) {
    return 'There are no scores yet!';
  }
  const leaders = contestants.sort((a, b) => {
    const {value: aScore} = a.channelScore(body.channel_id);
    const {value: bScore} = b.channelScore(body.channel_id);
    if (bScore > aScore) {
      return 1;
    }
    if (aScore > bScore) {
      return -1;
    }
    return 0;
  }).map((contestant, i) => {
    return `${i + 1}. ${contestant.name}: ${numeral(contestant.channelScore(body.channel_id).value).format(formatter)}`;
  });
  let res = '';
  if (showHeader) {
    res += 'Here are the current scores for this game:';
  }
  return `${res}\n\n${leaders.join('\n')}`;
}

export async function newgame({game, body}) {
  if (game && !game.isComplete()) {
    return 'It looks like a game is already in progress! You need to finish or end that one first before starting a new game.';
  }
  // Start the game:
  await Game.start({
    channel_id: body.channel_id
  });
  const url = await getImageUrl({
    file: 'board',
    channel_id: body.channel_id
  });
  return `Let's get this game started! ${url}`;
}

export async function endgame({game}) {
  if (!game) {
    return `There's no game in progress. You can always start a new game by typing "new game".`;
  }
  // Try to end the game:
  await game.end();
  return `Alright, I've ended that game for you. You can always start a new game by typing "new game".`;
}

// For daily doubles:
export async function wager({game, contestant, body, value}) {
  // Sanity check (this function is easy to trigger accidently):
  if (!game || !game.isDailyDouble || game.dailyDouble.contestant !== contestant.slackid || game.dailyDouble.wager) {
    return '';
  }
  // Validate the value of the wager:
  if (value < 5) {
    return 'That wager is too low.';
  }
  // Wager must be less than or equal to the value of the clue, or all of your money.
  if (value > contestant.channelScore(body.channel_id).value && value > game.getClue().value) {
    return 'That wager is too high.';
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

  return `For ${numeral(value).format(formatter)}, here's your clue. ${url}`;
}

export async function guess({game, contestant, body, guess}) {
  // Cache the clue reference:
  const clue = game.getClue();

  let correct;
  try {
    correct = await game.guess({
      guess,
      contestant: contestant.slackid
    });
  } catch (e) {
    // Timeout:
    if (e.message.includes('timeout')) {
      // We timed out, so mark this question as done.
      await game.answer();

      const res = `Time's up, ${contestant.name}! Remember, you have ${config.CLUE_TIMEOUT} seconds to answer. The correct answer is \`${clue.answer}\`.`;

      if (game.isComplete()) {
        return `${res} ${ await endGameMessage({game, body}) }`;
      } else {
        const url = await getImageUrl({
          file: 'board',
          channel_id: body.channel_id
        });
        return `${res} Select a new category. ${url}`;
      }
    }
    // They've already guessed
    if (e.message.includes('contestant')) {
      return `You had your chance, ${contestant.name}. Let someone else answer.`;
    }
    // Daily doubles need wagers:
    if (e.message.includes('wager')) {
      return 'You need to make a wager before you guess.';
    }

    // Just ignore guesses if they're outside of the game context:
    return '';
  }

  // Extract the value from the current clue:
  let {value} = clue;

  // Daily doubles have a different value:
  if (game.isDailyDouble) {
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

    const res = `That is correct, ${contestant.name}. Your score is ${numeral(contestant.channelScore(body.channel_id).value).format(formatter)}.`;

    if (game.isComplete()) {
      return `${res} ${ await endGameMessage({game, body}) }`;
    } else {
      // Get the new board url:
      const url = await getImageUrl({
        file: 'board',
        channel_id: body.channel_id
      });
      return `${res} Select a new category. ${url}`;
    }
  } else {
    await contestant.incorrect({
      value,
      channel_id: body.channel_id
    });
    return `That is incorrect, ${contestant.name}. Your score is now ${numeral(contestant.channelScore(body.channel_id).value).format(formatter)}.`;
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
      return `There's already an active clue. Wait your turn.`;
    }
    if (e.message.includes('value')) {
      return `I'm sorry, I can't give you a clue for that value.`;
    }
    if (e.message.includes('category')) {
      return `I'm sorry, I don't know what category that is. Try being more specific.`;
    }
    console.log('Unexpected category selection error.', e);
    // Just ignore it:
    return '';
  }

  // You found a daily double!
  if (game.isDailyDouble) {
    const dailyDoubleUrl = await getImageUrl({
      file: 'dailydouble',
      channel_id: body.channel_id
    });

    return `Answer: Daily Double ${dailyDoubleUrl} \nWhat would you like to wager, ${contestant.name}?`;
  } else {
    const url = await getImageUrl({
      file: 'clue',
      channel_id: body.channel_id
    });
    // Mark that we're sending the clue now:
    await game.clueSent();
    return `Here's your clue. ${url}`;
  }
}

async function endGameMessage({body, game}) {
  let str = `\nAnd that's it for this round of Jeopardy. Let's take a look at the final scores...`;
  str += `${ await scores({body, showHeader: false}) }`;
  str += `\n\nThanks for playing! You can always start another game by typing "new game".`;

  await game.end();
  return str;
}
