import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import { join } from 'path';
import basicAuth from 'basic-auth-connect';
import winston from 'winston';

import api, { provideBot } from './api';
import SlackBot from './slackbot';
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

// Re-usable authentication for admin pages:
const adminAuth = basicAuth(ADMIN_USERNAME, ADMIN_PASSWORD);

// Add API endpoints for admin panel:
app.use('/api', api(adminAuth));

// Add endpoints for the assets:
app.use('/assets', express.static('assets'));

app.use('/admin', adminAuth);
app.use('/admin', express.static('lib/admin'));
app.get('/admin/*', (req, res) => {
  res.sendFile(join(__dirname, 'admin', 'index.html'));
});

// Boot up the slackbot:
const bot = new SlackBot();
provideBot(bot);

// Boot up the jeopardy app:
app.listen(PORT, () => {
  winston.info(`Jeopardy Bot listening on port ${PORT}`);
});
