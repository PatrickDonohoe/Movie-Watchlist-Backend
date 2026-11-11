import express from 'express';

import {
  getMovie,
  addMovie,
  updateMovie,
  removeMovie,
} from '../controllers/movieController.js';
import { MovieSchema } from '../validators/movieValidators.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/:id', getMovie);

router.post('/', validateRequest(MovieSchema), addMovie);

router.put('/:id', validateRequest(MovieSchema), updateMovie);

router.delete('/:id', removeMovie);

export default router;
