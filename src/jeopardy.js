import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import Pageres from 'pageres';
import fetch from 'node-fetch';
import Imagemin from 'imagemin';
import { join } from 'path';
import { unlink } from 'fs';
import { dust } from 'adaro';

import responses from './responses';
import { upload } from './upload';
import { MessageReader } from './MessageReader';

import { Game } from './models/Game';
import { Contestant } from './models/Contestant';

import * as constants from './models/constants';

export const commands = {
  poke() {
    return `I'm here, I'm here...`;
  },

  async leaderboard({body}) {
    const contestants = await Contestant.find().limit(5);
    if (contestants.length === 0) {
      return 'There are no winners yet. Go out there and play some games!';
    }
    const leaders = contestants.sort((a, b) => {
      if (a.stats.money > b.stats.money) {
        return 1;
      }
      if(b.stats.money > a.stats.money) {
        return -1;
      }
      return 0;
    }).map((contestant, i) => {
      return (
`${i + 1}. ${contestant.name}:
> _$${contestant.stats.money}_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses_`
      );
    });
    return `Let's take a look at the leaderboard:\n\n${leaders.join('\n')}`;
  },

  async scores({body}) {
    const contestants = await Contestant.find({
      scores: {
        $elemMatch: {
          channel_id: body.channel_id,
          value: {
            $gt: 0
          }
        }
      }
    });
    if (contestants.length === 0) {
      return 'There are no scores yet!';
    }
    const leaders = contestants.sort((a, b) => {
      const aScore = a.channelScore(body.channel_id);
      const bScore = b.channelScore(body.channel_id);
      if (aScore > bScore) {
        return 1;
      }
      if(bScore > aScore) {
        return -1;
      }
      return 0;
    }).map((contestant, i) => {
      return `${i + 1}. ${contestant.name}: ${contestant.channelScore(body.channel_id).value}`;
    });
    return `Here are the current scores for this game:\n\n${leaders.join('\n')}`;
  },

  async new({game, body}) {
    if (game) {
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
  },

  async end({game, body}) {
    if (!game) {
      return `There's no game in progress. You can always start a new game by typing "new game".`;
    }
    // Try to end the game:
    await Game.end({
      channel_id: body.channel_id
    });
    return `Alright, I've ended that game for you. You can always start a new game by typing "new game".`;
  },

  help() {
    return responses.help;
  },

  async guess({game, contestant, body, guess}) {

    // Cache the clue reference:
    const clue = game.getClue();

    let correct;
    try {
      correct = await game.guess({guess, contestant});
    } catch(e) {
      // Timeout:
      if (e.message.includes('timeout')) {
        const [url] = await Promise.all([
          getImageUrl({
            file: 'board',
            channel_id: body.channel_id
          }),
          // We timed out, so mark this question as done.
          game.answer()
        ]);
        return `Time's up, ${contestant.name}! Remember, you have 45 seconds to answer. The correct answer is \`${clue.answer}\`. Select a new category. ${url}`;
      }
      // They've already guessed
      if (e.message.includes('contestant')) {
        return `You had your chance, ${contestant.name}. Let someone else answer.`;
      }
      // Just ignore guesses if they're outside of the game context:
      return '';
    }

    // Extract the value from the current clue:
    const {value} = clue;

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
      // Get the new board url:
      const url = await getImageUrl({
        file: 'board',
        channel_id: body.channel_id
      });
      return `That is correct, ${contestant.name}. Your score is $${contestant.channelScore(body.channel_id).value}. Select a new category. ${url}`;
    } else {
      await contestant.incorrect({
        value,
        channel_id: body.channel_id
      });
      return `That is incorrect, ${contestant.name}. Your score is now $${contestant.channelScore(body.channel_id).value}.`;
    }
  },

  async category({game, contestant, body, category, value}) {
    try {
      await game.newClue({category, value});
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
      // Just ignore the input:
      return ''
    }
    const url = await getImageUrl({
      file: 'clue',
      channel_id: body.channel_id
    });
    // Mark that we're sending the clue now:
    await game.clueSent();
    return `Here's your clue. ${url}`;
  }
};

async function command(message) {
  return commands[message.command](message);
};

// TODO: Move this?
const MONGO_URL = process.env.MONGOLAB_URI || 'mongodb://localhost/jeopardy'
mongoose.connect(MONGO_URL);

// TODO: Move this?
const port = process.env.PORT || 8000;

const app = express();

async function getImageUrl({file, channel_id}) {
  await fetch(`http://localhost:${port}/image/${channel_id}/${file}`);

  const fileName = join(__dirname, 'images', `${channel_id}.${file}.png`);

  let url = await upload(fileName);

  // After we've uploaded the image, we don't need it locally anymore.
  // Schedule it for next tick to prevent it from blocking the response.
  process.nextTick(() => {
    unlink(fileName, () => {});
  });
  return url;
};

const options = {
  helpers: [
    (dust) => {
      dust.helpers.Card = (chunk, context, bodies, params) => {
        const questions = context.get('questions');
        const value = context.resolve(params.value);
        const id = context.resolve(params.id);
        var question = questions.find((q) => {
          return q.value === value && q.category_id === id;
        });
        if (question.answered) {
          chunk.write('');
        } else {
          chunk.write(`<span class="dollar">$</span>${value}`);
        }
      }
    }
  ]
}

app.engine('dust', dust(options));
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

// TODO: Move these:
const username = 'JeopardyBot';
const bot = 'USLACKBOT';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/command', async function(req, res, next) {
  // Load the current game and the contestant into the request:
  const [contestant, game] = await Promise.all([
    Contestant.get(req.body),
    Game.forChannel(req.body)
  ]);
  req.game = game;
  req.contestant = contestant;
  next();
});

app.post('/command', (req, res) => {
  // Ignore messages from ourself:
  if (req.body.user_id === bot) return res.end();

  let text = req.body.text;
  if (req.body.trigger_word) {
    let replacer = new RegExp(req.body.trigger_word, '');
    text = text.replace(replacer, '');
  }
  const message = MessageReader.parse(text);
  if (message && message.command) {
    command({
      body: req.body,
      contestant: req.contestant,
      game: req.game,
      // Spread the parsed response into this object:
      ...message
    }).then(text => {
      // If they return empty, just end the response:
      if (text === '') {
        res.end();
      } else {
        res.json({
          username,
          text
        });
      }
    }).catch((e) => {
      console.log(e, e.stack);
      // Make sure we always send some response:
      res.end();
    });
  } else {
    // Send nothing:
    res.end();
  }
});

app.get('/:channel_id/board', (req, res) => {
  Game.forChannel({
    channel_id: req.params.channel_id
  }).then(({categories, questions}) => {
    res.render('board', {
      categories,
      questions,
      values: constants.VALUES
    });
  });
});

app.get('/:channel_id/clue', (req, res) => {
  Game.forChannel({
    channel_id: req.params.channel_id
  }).then(game => {
    res.render('clue', {
      clue: game.getClue()
    });
  });
});

app.get('/image/:channel_id/:name', (req, res) => {
  var pageres = new Pageres()
    .src(`localhost:${port}/${req.params.channel_id}/${req.params.name}`, ['1200x654'], {crop: false, filename: `${req.params.channel_id}.${req.params.name}`})
    .dest(join(__dirname, 'images'));

  pageres.run(function (err, [item]) {
    console.time('min');
    new Imagemin()
      .src(join(__dirname, 'images', item.filename))
      .dest(join(__dirname, 'images'))
      .use(Imagemin.optipng({optimizationLevel: 1}))
      .run(function (err, [file]) {
        console.timeEnd('min');
        res.send('ok');
      });
  });
});

app.listen(port, () => {
  console.log(`Jeopardy Bot listening on port ${port}`);
});
