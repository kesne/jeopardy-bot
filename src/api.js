import { Router } from 'express';
import restify from 'express-restify-mongoose';

import { broadcast } from './trebek';

import App from './models/App';
import Studio from './models/Studio';
import Contestant from './models/Contestant';

export default (adminAuth) => {
  // Set up REST routes to manipulate models:
  const router = new Router();
  router.use(adminAuth);

  // Auto-generated routes:
  restify.serve(router, App, { lowercase: true });
  restify.serve(router, Studio, { lowercase: true, idProperty: 'id' });
  restify.serve(router, Contestant, { lowercase: true, idProperty: 'slackid' });

  // Manual non-model-backed routes:
  router.post('/api/v1/broadcasts/', (req, res) => {
    if (req.body.message) {
      if (req.body.studio) {
        broadcast(req.body.message, req.body.studio);
      } else {
        broadcast(req.body.message);
      }
    }
    res.end();
  });

  return router;
};
