import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import { join } from 'path';
import adaro from 'adaro';
import basicAuth from 'basic-auth-connect';
import restify from 'express-restify-mongoose';

import App from './models/App';
import Studio from './models/Studio';
import Contestant from './models/Contestant';

import SlackBot from './slackbot';
import Webhook from './webhook';
import { broadcast } from './trebek';
import * as config from './config';

mongoose.connect(config.MONGO);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up REST routes to manipulate models:
const apiRouter = new express.Router();
apiRouter.use(basicAuth(config.ADMIN_USERNAME, config.ADMIN_PASSWORD));
restify.serve(apiRouter, App, { lowercase: true });
restify.serve(apiRouter, Studio, { lowercase: true, idProperty: 'id' });
restify.serve(apiRouter, Contestant, { lowercase: true, idProperty: 'slackid' });
app.use(apiRouter);


app.engine('dust', adaro.dust({
  cache: false,
  helpers: [
    'dustjs-helpers',
    dust => {
      dust.helpers.iter = (chunk, context, bodies, params) => {
        const obj = context.resolve(params.obj);
        const iterable = [];
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            iterable.push({
              $key: key,
              $value: value,
            });
          }
        }
        return chunk.section(iterable, context, bodies);
      };
    },
  ],
}));
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

// Install landing page:
app.get('/welcome', (req, res) => {
  res.render('welcome');
});

app.use('/new-admin', express.static('lib/admin'));
app.get('/new-admin', (req, res) => {
  res.render('new_admin');
});

// Admin Routes:
app.use('/admin', basicAuth(config.ADMIN_USERNAME, config.ADMIN_PASSWORD));
app.get('/admin', (req, res) => {
  res.redirect('/admin/home');
});
app.get('/admin/:view', async (req, res) => {
  const a = await App.get();
  const studios = await Studio.find();
  let studio;
  if (req.query.studio) {
    studio = studios.find(s => s.name === req.query.studio);
    if (!studio) {
      return res.sendStatus(404);
    }
    studio = studio.toObject();
  }

  const studioValues = [
    {
      name: 'Clue Timeout',
      description: 'The number of seconds before a clue times out.',
      key: 'timeout',
      type: 'number',
    },
    {
      name: 'Challenge Timeout',
      description: 'The number of seconds before a challenge times out.',
      key: 'challengeTimeout',
      type: 'number',
    },
    {
      name: 'Board Control Timeout',
      description: 'The number of seconds that control of the board is held.',
      key: 'boardControlTimeout',
      type: 'number',
    },
    {
      name: 'Minimum Challenge Votes',
      description: 'The minimum number of votes required for a challenge to be accepted.',
      key: 'minimumChallengeVotes',
      type: 'number',
    },
    {
      name: 'Challenge Threshold',
      description: 'The percentage of votes that are required for a challenge to be accepted.',
      key: 'challengeAcceptenceThreshold',
      type: 'number',
    },
  ];
  res.render(`admin/${req.params.view}`, {
    studios,
    studio,
    studioValues,
    // stats,
    app: a,
  });
});

// Admin routes that update configuration:
app.post('/admin/update/studio', async (req, res) => {
  const studio = await Studio.findOne({
    id: req.body.id,
    name: req.body.studio,
  });
  if (req.body.feature) {
    studio.features[req.body.feature].enabled = req.body.enabled;
  } else if (req.body.values) {
    studio.values[req.body.values] = req.body.value;
  } else if (req.body.toggle) {
    studio.enabled = !studio.enabled;
  }
  await studio.save();
  res.redirect(`/admin/studio?studio=${req.body.studio}`);
});
app.post('/admin/update/app', async (req, res) => {
  const a = await App.get();
  a[req.body.name] = req.body.value;
  await a.save();
  res.send('ok');
});
app.post('/admin/broadcast', (req, res) => {
  if (req.body.studio) {
    broadcast(req.body.message, req.body.id);
    res.redirect(`/admin/studio?studio=${req.body.studio}`);
  } else {
    broadcast(req.body.message);
    res.redirect('/admin/home');
  }
});

app.get('/renderable/categories', (req, res) => {
  const datas = decodeURIComponent(req.query.data).split('@@~~AND~~@@');
  res.render('categories', {
    datas,
  });
});

const clueExtra = /^\(([^)]+)\)\s*\.?/;
app.get('/renderable/clue', (req, res) => {
  let extra;
  let data = req.query.data;
  const extraRegexResult = clueExtra.exec(data);
  if (extraRegexResult) {
    data = data.substring(extraRegexResult[0].length);
    extra = extraRegexResult[1];
  }
  res.render('clue', {
    data,
    extra,
  });
});

// Holds the instance of the bot or webhook:
let liveInstance;

function rebootInstance(bot = false) {
  // Same mode:
  if ((liveInstance instanceof SlackBot && bot) || (liveInstance instanceof Webhook && !bot)) {
    return;
  }
  // If we're already running, let's tear down first:
  if (liveInstance) {
    liveInstance.destroy();
  }
  // Boot the new instance:
  if (bot) {
    liveInstance = new SlackBot();
  } else {
    liveInstance = new Webhook(app);
  }
}

App.schema.post('save', (doc) => {
  rebootInstance(doc.isBot());
});

// Boot up the jeopardy app:
app.listen(config.PORT, async () => {
  const a = await App.get();
  console.log(`Jeopardy Bot listening on port ${config.PORT}`);
  // If we're in a mode that needs the webhook, then set it up:
  rebootInstance(a.isBot());
});
