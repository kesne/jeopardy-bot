import mongoose from 'mongoose';
import express from 'express';
import { join } from 'path';
import { dust } from 'adaro';
import { Game } from './models/Game';
import { Person } from './models/Person';

mongoose.connect('mongodb://localhost/test');

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
          chunk.write('$' + value);
        }
      }
    }
  ]
}

app.engine('dust', dust(options));
app.set('view engine', 'dust');
app.set('views', join(__dirname, 'views'));

// TODO: Body parsing
// TODO: Stateless, so we can resume back into an in-progress game.

app.post('/command', (req, res) => {

});

app.get('/answer', (req, res) => {
  Game.activeGame().then(game => {
    const id = parseInt(req.query.id, 10);
    game.questions.some((q) => {
      if (q.id === id) {
        q.answered = true;
        return true;
      }
    });
    return game.save();
  }).then(() => {
    res.send('done');
  });
});

app.get('/', (req, res) => {
  Game.activeGame().then(game => {
    res.render('board', {
      categories: game.categories,
      questions: game.questions,
      values: [200, 400, 600, 800, 1000]
    });
  });
});

app.get('/startgame', (req, res) => {
  Game.start().then(() => {
    res.send('ok');
  }).catch((e) => {
    res.send('no');
  });
});

app.get('/endgame', (req, res) => {
  Game.end().then(() => {
    res.send('ok');
  });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Jeopardy Bot listening on port ${port}`);
});