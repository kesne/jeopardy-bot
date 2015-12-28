import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import { join } from 'path';
import adaro from 'adaro';
import basicAuth from 'basic-auth-connect';
import winston from 'winston';

import App from './models/App';

import api from './api';
import SlackBot from './slackbot';
import Webhook from './webhook';
import * as config from './config';

mongoose.connect(config.MONGO);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Re-usable authentication for admin pages:
const adminAuth = basicAuth(config.ADMIN_USERNAME, config.ADMIN_PASSWORD);

// Add API endpoints for admin panel:
app.use('/api', api(adminAuth));

// Add endpoints for the assets:
app.use('/assets', express.static('assets'));

app.engine('dust', adaro.dust({
  cache: false,
  helpers: [
    'dustjs-helpers',
  ],
}));
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

// TODO: Reactify:
// Install landing page:
app.get('/welcome', (req, res) => {
  res.render('welcome');
});

app.use('/admin', adminAuth);
app.use('/admin', express.static('lib/admin'));
app.get('/admin/*', (req, res) => {
  res.render('admin');
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
  winston.info(`Jeopardy Bot listening on port ${config.PORT}`);
  // If we're in a mode that needs the webhook, then set it up:
  rebootInstance(a.isBot());
});
