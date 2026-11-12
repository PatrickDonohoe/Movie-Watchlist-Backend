import express from 'express';
import {
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlist,
  getWatchlist,
  getWatchlistItem,
} from '../controllers/watchlistController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  AddToWatchlistSchema,
  UpdateWatchlistSchema,
} from '../validators/watchlistValidators.js';
import { IdParamSchema } from '../validators/commonValidators.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getWatchlist);

router.get(
  '/:id',
  validateRequest({ params: IdParamSchema }),
  getWatchlistItem
);

router.post(
  '/',
  validateRequest({ body: AddToWatchlistSchema }),
  addToWatchlist
);

router.put(
  '/:id',
  validateRequest({ params: IdParamSchema, body: UpdateWatchlistSchema }),
  updateWatchlist
);

router.delete(
  '/:id',
  validateRequest({ params: IdParamSchema }),
  removeFromWatchlist
);

export default router;
