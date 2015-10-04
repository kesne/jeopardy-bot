import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import Pageres from 'pageres';
import fetch from 'node-fetch';
import { MessageReader } from './MessageReader';
import { join } from 'path';
import { dust } from 'adaro';
import { setClientId } from 'imgur';
import { upload } from './upload';
import { Game } from './models/Game';
import { Person } from './models/Person';

const helpMessage = `
Here, this should help you out!
>*Games*
>    “new game” - Starts a new game.
>    “end game” - Ends the current game.
>*Selecting Categories*
>    “I’ll take ________ for $___”
>    “Give me ________ for $___”
>    “Choose ________ for $___”
>    “ ________ for $___”
>    “Same category (for) $___”
>*Guessing*
>    “What [is|are] _______”
>    “Who [is|are] ________”
>    “Where [is|are] ______”
>*Scores*
>    “scores” - Shows the score for the current game.
>    “leaderboard” - Shows the scores and wins from all games.
`;

// Allow setting the imgur api:
if (process.env.IMGUR_API) {
  setClientId(process.env.IMGUR_API);
}

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
          chunk.write(`$${value}`);
        }
      }
    }
  ]
}

app.engine('dust', dust(options));
app.use(bodyParser.json());
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

// TODO: Body parsing
// TODO: Stateless, so we can resume back into an in-progress game.

app.post('/command', (req, res) => {
  const command = MessageReader.read(req.body);
  console.log('command', command);
  res.send('ok');
  
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
  Game.activeGame().then(game => {
    res.render('clue', {
      clue: game.activeClue
    });
  });
});

app.get('/getclue/:title/:value', (req, res) => {
  Game.getClue(req.params.title, req.params.value).then(clue => {
    res.send('Got clue');
  });
});

app.get('/guess/:whatis', (req, res) => {
  Game.guess(req.params.whatis).then(valid => {
    res.send(valid);
  });
});

app.get('/answer', (req, res) => {
  Game.answer().then(() => {
    res.send('done');
  });
});

app.get('/startgame', (req, res) => {
  Game.start().then(() => {
    res.send('ok');
  }).catch((e) => {
    res.send('no');
  });
});

app.get('/endgame', (req, res) => {
  Game.end().then(() => {
    res.send('ok');
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
    .src(`localhost:${port}/board`, ['1000x654'], {crop: false, filename: 'board'})
    .dest(join(__dirname, 'images'));

  pageres.run(function (err, items) {
    res.sendFile(join(__dirname, 'images', 'board.png'));
  });
});

app.listen(port, () => {
  console.log(`Jeopardy Bot listening on port ${port}`);
});