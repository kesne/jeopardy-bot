import 'babel/polyfill';
import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import {join} from 'path';
import {dust} from 'adaro';
import basicAuth from 'basic-auth-connect';
 
import App from './models/App';
import Studio from './models/Studio';
import Bot from './bot';
import Webhook from './webhook';
import * as config from './config';

mongoose.connect(config.MONGO);

const app = express();

app.engine('dust', dust({
  cache: false,
  helpers: [
    dust => {
      dust.helpers.iter = (chunk, context, bodies, params) => {
        const obj = context.resolve(params.obj);
        const iterable = [];
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            iterable.push({
              $key: key,
              $value: value
            });
          }
        }
        return chunk.section(iterable, context, bodies);
      };
    }
  ]
}));
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Install landing page:
app.get('/welcome', (req, res) => {
  res.render('welcome');
});

// Admin Routes:
app.use('/admin', basicAuth('jeopardy', 'airbnb'));
app.get('/admin', (req, res) => {
  res.redirect('admin/home');
});
app.get('/admin/:view', async (req, res) => {
  const studios = await Studio.find();
  let studio;
  if (req.query.studio) {
    studio = studios.find(s => s.name === req.query.studio);
  }
  res.render(`admin/${req.params.view}`, {
    studios,
    studio,
    // stats,
    query: req.query
  });
});

// Admin routes that update configuration:
app.post('/admin/update/studio', (req, res) => {
  res.send('ok');
});
app.post('/admin/update/app', (req, res) => {
  res.send('ok');
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

// Boot up the jeopardy app:
app.listen(config.PORT, async () => {
  const app = await App.get();
  console.log(`Jeopardy Bot listening on port ${config.PORT}`);
  // If we're in a mode that needs the webhook, then set it up:
  if (app.isBot()) {
    new Bot();
  } else {
    new Webhook(app);
  }
});
