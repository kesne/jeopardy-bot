import { Router } from 'express';
import restify from 'express-restify-mongoose';
import App, { invalidate } from './models/App';
import Studio from './models/Studio';
import Contestant from './models/Contestant';

let bot;

export function provideBot(instance) {
  bot = instance;
}

export default (adminAuth) => {
  // Set up REST routes to manipulate models:
  const router = new Router();
  router.use(adminAuth);

  // Auto-generated routes:
  restify.serve(router, App, {
    prefix: '',
    lowercase: true,
    postUpdate() {
      invalidate();
    },
  });
  restify.serve(router, Studio, { prefix: '', lowercase: true, idProperty: 'id' });
  restify.serve(router, Contestant, { prefix: '', lowercase: true, idProperty: 'id' });

  // Manual non-model-backed routes:
  router.post('/v1/broadcasts/', (req, res) => {
    bot.broadcast(req.body.message, req.body.studio);
    res.end();
  });

  router.post('/v1/authtest', async (req, res) => {
    res.json(await bot.authTest(req.body));
  });

  return router;
};
