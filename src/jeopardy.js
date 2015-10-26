import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import {lock, unlock} from './commands/locks';
import {join} from 'path';
import {dust} from 'adaro';

import {read} from './MessageReader';
import {exec} from './commands/exec';
import {Game} from './models/Game';
import {Contestant} from './models/Contestant';
import * as config from './config';

mongoose.connect(config.MONGO);

const app = express();

app.engine('dust', dust());
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/command', async (req, res) => {
  // Ignore unverified messages:
  if (config.VERIFY_TOKENS && !config.VERIFY_TOKENS.includes(req.body.token)) {
    return res.end();
  }
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

// Anything rendered by our capturing service goes through here:
app.get('/renderable/:view', (req, res) => {
  res.render(req.params.view, {
    data: decodeURIComponent(req.query.data)
  });
});

// Boot up the jeopardy app:
app.listen(config.PORT, () => {
  console.log(`Jeopardy Bot listening on port ${config.PORT}`);
});
