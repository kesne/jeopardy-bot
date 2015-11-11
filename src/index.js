import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import {join} from 'path';
import {dust} from 'adaro';

import Bot from './bot';
import Webhook from './webhook';
import * as config from './config';

mongoose.connect(config.MONGO);

const app = express();

app.engine('dust', dust());
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Heroku landing page:
app.get('/welcome', (req, res) => {
  res.render('welcome');
});

app.get('/renderable/categories', (req, res) => {
  const datas = decodeURIComponent(req.query.data).split('@@~~AND~~@@');
  res.render('categories', {
    datas
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
    extra
  });
});

// If we're in a mode that needs the webhook, then set it up:
if (config.MODE !== 'bot') {
  new Webhook(app);
} else {
  new Bot();
}

// Boot up the jeopardy app:
app.listen(config.PORT, () => {
  console.log(`Jeopardy Bot listening on port ${config.PORT}`);
});
