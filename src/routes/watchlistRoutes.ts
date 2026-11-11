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

const router = express.Router();

router.use(authMiddleware);

router.get('/', getWatchlist);

router.get('/:id', getWatchlistItem);

router.post('/', validateRequest(AddToWatchlistSchema), addToWatchlist);

router.put('/:id', validateRequest(UpdateWatchlistSchema), updateWatchlist);

router.delete('/:id', removeFromWatchlist);

export default router;
