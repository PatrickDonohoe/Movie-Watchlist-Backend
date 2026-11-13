import express from 'express';
import { createWatchlistController } from '../controllers/watchlistController.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  AddToWatchlistSchema,
  UpdateWatchlistSchema,
} from '../validators/watchlistValidators.js';
import { IdParamSchema } from '../validators/commonValidators.js';
import { AppDeps } from '../app.js';

export const createWatchlistRouter = (deps: AppDeps) => {
  const c = createWatchlistController(deps);
  const router = express.Router();

  router.use(createAuthMiddleware(deps));

  router.get('/', c.getWatchlist);

  router.get(
    '/:id',
    validateRequest({ params: IdParamSchema }),
    c.getWatchlistItem
  );

  router.post(
    '/',
    validateRequest({ body: AddToWatchlistSchema }),
    c.addToWatchlist
  );

  router.put(
    '/:id',
    validateRequest({ params: IdParamSchema, body: UpdateWatchlistSchema }),
    c.updateWatchlist
  );

  router.delete(
    '/:id',
    validateRequest({ params: IdParamSchema }),
    c.removeFromWatchlist
  );

  return router;
};
