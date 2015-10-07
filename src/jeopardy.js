import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import Pageres from 'pageres';
import lockFile from 'lockfile';
import Imagemin from 'imagemin';
import { join } from 'path';
import { dust } from 'adaro';

import { upload } from './upload';
import { MessageReader } from './MessageReader';
import execCommand from './commands/exec';
import { Game } from './models/Game';
import { Contestant } from './models/Contestant';
import * as config from './config';

mongoose.connect(config.MONGO);

const app = express();

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/command', (req, res) => {
  // Ignore messages from ourself:
  if (req.body.user_id === config.BOT_ID) return res.end();

  const message = MessageReader.read(req.body);
  console.log(message);
  if (!message || !message.command) return res.end();
  req.message = message;

  const channel_id = req.body.channel_id;

  lockFile.lock(`jeopardy-${channel_id}.lock`, {
    // Wait a maximum of 10 seconds:
    wait: 10 * 1000
  }, async function(err) {
    if (err) {
      console.log('Error locking file', err);
      return res.end();
    }
    // Hold the channel (block other requests from processing):
    let response;
    try {
      response = await handleRequest(req);
    } catch(e) {
      console.log(e);
    }

    if (response) {
      res.json(response);
    } else {
      res.end();
    }

    lockFile.unlock(`jeopardy-${channel_id}.lock`, er => {});
  });
});

async function handleRequest(req) {
  // Load the current game and the contestant into the request:
  const [contestant, game] = await Promise.all([
    Contestant.get(req.body),
    Game.forChannel(req.body)
  ]);

  const text = await execCommand({
    body: req.body,
    contestant,
    game,
    // Spread the parsed request text into this object:
    ...req.message
  });

  if (text) {
    return {
      username: config.USERNAME,
      text
    };
  }
};


app.get('/:channel_id/board', (req, res) => {
  Game.forChannel({
    channel_id: req.params.channel_id
  }).then(({categories, questions}) => {
    res.render('board', {
      categories,
      questions,
      values: config.VALUES
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
    .src(`localhost:${config.PORT}/${req.params.channel_id}/${req.params.name}`, ['1200x654'], {crop: false, filename: `${req.params.channel_id}.${req.params.name}`})
    .dest(join(__dirname, '..', 'images'));

  console.time('Image Capture');
  pageres.run(function (err, [item]) {
    console.timeEnd('Image Capture');
    if (config.IMAGE_MIN) {
      console.time('Image Minification');
      new Imagemin()
        .src(join(__dirname, '..', 'images', item.filename))
        .dest(join(__dirname, '..', 'images'))
        .use(Imagemin.optipng({optimizationLevel: 1}))
        .run(function (err, [file]) {
          console.timeEnd('Image Minification');
          res.send('ok');
        });
    } else {
      res.send('ok');
    }
  });
});

app.listen(config.PORT, () => {
  console.log(`Jeopardy Bot listening on port ${config.PORT}`);
});
