import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import { join } from 'path';
import basicAuth from 'basic-auth-connect';
import winston from 'winston';

import App from './models/App';

import api from './api';
import SlackBot from './slackbot';
import Webhook from './webhook';
import { ADMIN_USERNAME, ADMIN_PASSWORD, MONGO, PORT } from './config';

// Set log level
winston.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

mongoose.connect(MONGO);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
app.listen(PORT, async () => {
  const a = await App.get();
  winston.info(`Jeopardy Bot listening on port ${PORT}`);
  // If we're in a mode that needs the webhook, then set it up:
  rebootInstance(a.isBot());
});
