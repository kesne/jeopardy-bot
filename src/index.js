import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import { join } from 'path';
import basicAuth from 'basic-auth-connect';
import winston from 'winston';

import App from './models/App';

import api, { provideBot } from './api';
import SlackBot from './slackbot';
import HipchatBot from './hipchatbot';
import { ADMIN_USERNAME, ADMIN_PASSWORD, MONGO, PORT } from './config';

// Set log level
winston.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

mongoose.connect(MONGO);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Slash command
app.all('/slash', (req, res) => {
  res.end(`I'm awake! You should be able to play games.`);
});

const adminBasicAuth = basicAuth(ADMIN_USERNAME, ADMIN_PASSWORD);
// Re-usable authentication for admin pages (engages when there's an apiToken):
const adminAuth = async (...args) => {
  const [, , next] = args;
  const a = await App.get();
  if (a.apiToken) {
    return adminBasicAuth(...args);
  }
  next();
};

// Add API endpoints for admin panel:
app.use('/api', api(adminAuth));

// Add endpoints for the assets:
app.use('/assets', express.static('assets'));

app.use('/admin', adminAuth);
app.use('/admin', express.static('lib/admin'));
app.get('/admin/*', (req, res) => {
  res.sendFile(join(__dirname, 'admin', 'index.html'));
});

// Load the proper bot class based on platform config.
// TODO: refactor into BotManager
App.get().then(a => {
  let bot;
  if (a.platform === 'hipchat') {
    bot = new HipchatBot(app, a);
  } else if (a.platform === 'slack') {
    bot = new SlackBot(a);
  }
  provideBot(bot);
});

// Boot up the jeopardy app:
app.listen(PORT, () => {
  winston.info(`JeopardyBot listening on port ${PORT}`);
});
