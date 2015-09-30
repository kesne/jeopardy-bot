import mongoose from 'mongoose';
import express from 'express';
import { Game } from 'models/Game';
import { Person } from 'models/Person';

mongoose.connect('mongodb://localhost/test');

const app = express();

// TODO: Body parsing
// TODO: Stateless, so we can resume back into an in-progress game.

app.post('/command', (req, res) => {

});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Jeopardy Bot listening on port ${port}`);
});