import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import Pageres from 'pageres';
import fetch from 'node-fetch';
import { join } from 'path';
import { dust } from 'adaro';

import responses from './responses';
import { upload } from './upload';
import { MessageReader } from './MessageReader';

import { Game } from './models/Game';
import { Contestant } from './models/Contestant';

export const commands = {
  async new() {
    try {
      await Game.start()
    } catch(e) {
      console.log(e);
      return 'It looks like a game is already in progress! You need to finish or end that one first before starting a new game.';
    }
    const url = await getImageUrl('board');
    return `Let's get this game started! ${url}`;
  },
  end() {
    return Game.end()
      .then(() => `Alright, I've ended that game for you. You can always start a new game by typing "new game".`);
  },
  help() {
    return responses.help;
  },

  async guess({guess, contestant}) {
    let correct;
    try {
      correct = await Game.guess({guess, contestant});
    } catch(e) {
      // Timeout:
      if (e.message.includes('timeout')) {
        const [game, url] = await Promise.all([
          Game.activeGame(),
          getImageUrl('board'),
          // We timed out, so mark this question as done.
          Game.answer()
        ]);
        return `Time's up, ${contestant.name}! Remember, you have 45 seconds to answer. The correct answer is \`${game.getClue().answer}\`. Select a new category. ${url}`;
      }
      // They've already guessed
      if (e.message.includes('contestant')) {
        return `You had your chance, ${contestant.name}. Let someone else answer.`;
      }
      // Just ignore guesses if they're outside of the game context:
      return '';
    }
    const game = await Game.activeGame();
    const {value} = game.clue;
    if (correct) {
      // Speed this up:
      await Promise.all([
        // Award the value:
        contestant.correct(value),
        // Mark the question as answered:
        Game.answer()
      ]);
      // Get the new board url:
      const url = await getImageUrl('board');
      return `That is correct, ${contestant.name}. Your score is $${contestant.score}. Select a new category. ${url}`;
    } else {
      await contestant.incorrect(value);
      return `That is incorrect, ${contestant.name}. Your score is now $${contestant.score}.`;
    }
  },

  async category({category, value}) {
    try {
      await Game.getClue(category, value);
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
    const url = await getImageUrl('clue');
    // Mark that we're sending the clue now:
    await Game.clueSent();
    return `Here's your clue. ${url}`;
  }
};

async function command(message) {
  return commands[message.command](message);
};

const MONGO_URL = process.env.MONGOLAB_URI || 'mongodb://localhost/jeopardy'
mongoose.connect(MONGO_URL);

const port = process.env.PORT || 8000;

const app = express();

async function getImageUrl(file) {
  await fetch(`http://localhost:${port}/${file}.png`);
  let url = await upload(join(__dirname, 'images', `${file}.png`));
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

const username = 'JeopardyBot';
const bot = 'USLACKBOT';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/command', (req, res, next) => {
  // Get the contestant for this request.
  // This will create a new user if none exists.
  Contestant.get(req.body).then(contestant => {
    req.contestant = contestant;
    next();
  });
});

app.post('/command', (req, res) => {
  // Ignore messages from ourself:
  if (req.body.user_id === bot) return;

  const message = MessageReader.parse(req.body.text);
  if (message && message.command) {
    command({
      contestant: req.contestant,
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
      console.log(e.stack);
      // Make sure we always send some response:
      res.end();
    });
  } else {
    // Send nothing:
    res.end();
  }
});

app.get('/board', (req, res) => {
  Game.activeGame().then(game => {
    res.render('board', {
      categories: game.categories,
      questions: game.questions,
      values: [200, 400, 600, 800, 1000]
    });
  });
});

app.get('/clue', (req, res) => {
  Game.activeGame().then(({clue}) => {
    res.render('clue', {
      clue
    });
  });
});

app.get('/clue.png', (req, res) => {
  var pageres = new Pageres()
    .src(`localhost:${port}/clue`, ['1000x654'], {crop: false, filename: 'clue'})
    .dest(join(__dirname, 'images'));

  pageres.run(function (err, items) {
    res.sendFile(join(__dirname, 'images', 'clue.png'));
  });
});

app.get('/board.png', (req, res) => {
  var pageres = new Pageres()
    .src(`localhost:${port}/board`, ['1200x654'], {crop: false, filename: 'board'})
    .dest(join(__dirname, 'images'));

  pageres.run(function (err, items) {
    res.sendFile(join(__dirname, 'images', 'board.png'));
  });
});

app.listen(port, () => {
  console.log(`Jeopardy Bot listening on port ${port}`);
});