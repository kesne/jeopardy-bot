import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import Pageres from 'pageres';
import {lock, unlock} from './commands/locks';
import Imagemin from 'imagemin';
import {join} from 'path';
import {dust} from 'adaro';

import {read} from './MessageReader';
import {exec} from './commands/exec';
import {Game} from './models/Game';
import {Contestant} from './models/Contestant';
import * as config from './config';

mongoose.connect(config.MONGO);

const app = express();

// TODO: Move this.
const options = {
  helpers: [
    dust => {
      dust.helpers.Card = (chunk, context, bodies, params) => {
        const questions = context.get('questions');
        const value = context.resolve(params.value);
        const id = context.resolve(params.id);
        const question = questions.find(q => {
          return q.value === value && q.category_id === id;
        });
        if (question.answered) {
          chunk.write('');
        } else {
          chunk.write(`<span class="dollar">$</span>${value}`);
        }
      };
    }
  ]
};

app.engine('dust', dust(options));
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/command', async (req, res) => {
  // Ignore messages from ourself:
  if (req.body.user_id === config.BOT_ID || req.body.user_name === config.USERNAME) {
    return res.end();
  }

  // Try to parse the message:
  const message = read(req.body);

  // If we can't get a valid message out, just dump the request:
  if (!message || !message.command) {
    return res.end();
  }
  req.message = message;

  const channel_id = req.body.channel_id;

  try {
    await lock(channel_id);

    // Hold the channel (block other requests from processing):
    const response = await handleRequest(req);

    if (response) {
      res.json(response);
    } else {
      res.end();
    }

    await unlock(channel_id);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
  }
});

async function handleRequest(req) {
  // Load the current game and the contestant into the request:
  const [contestant, game] = await Promise.all([
    Contestant.get(req.body),
    Game.forChannel(req.body)
  ]);

  const text = await exec({
    body: req.body,
    contestant,
    game,
    // Spread the parsed request text into this object:
    ...req.message
  });

  if (text) {
    return {
      username: config.USERNAME,
      icon_emoji: ':jbot:',
      text
    };
  }
}

// Heroku landing page:
app.get('/welcome', (req, res) => {
  res.render('welcome');
});

app.get('/:channel_id/board', (req, res) => {
  Game.forChannel({
    channel_id: req.params.channel_id
  }).then(({categories, questions}) => {
    res.render('board', {
      categories,
      questions,
      values: config.VALUES
    });
  }).catch(() => {
    res.send('Internal Server Error');
  });
});

app.get('/:channel_id/clue', (req, res) => {
  Game.forChannel({
    channel_id: req.params.channel_id
  }).then(game => {
    res.render('clue', {
      clue: game.getClue()
    });
  }).catch(() => {
    res.send('Internal Server Error');
  });
});

app.get('/:channel_id/dailydouble', (req, res) => {
  res.render('dailydouble');
});

app.get('/image/:channel_id/:name', (req, res) => {
  const pageres = new Pageres()
    .src(`localhost:${config.PORT}/${req.params.channel_id}/${req.params.name}`, ['1200x654'], {crop: false, filename: `${req.params.channel_id}.${req.params.name}`})
    .dest(join(__dirname, '..', 'images'));

  console.time('Image Capture');
  pageres.run((err, [item]) => {
    console.timeEnd('Image Capture');
    if (config.IMAGE_MIN) {
      console.time('Image Minification');
      new Imagemin()
        .src(join(__dirname, '..', 'images', item.filename))
        .dest(join(__dirname, '..', 'images'))
        .use(Imagemin.optipng({optimizationLevel: 1}))
        .run(() => {
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
