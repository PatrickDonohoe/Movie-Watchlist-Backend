import express from 'express';

import {
  getMovie,
  getMovies,
  addMovie,
  updateMovie,
  removeMovie,
} from '../controllers/movieController.js';
import { MovieSchema } from '../validators/movieValidators.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { IdParamSchema } from '../validators/commonValidators.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/:id', validateRequest({ params: IdParamSchema }), getMovie);

router.get('/', getMovies);

router.post('/', validateRequest({ body: MovieSchema }), addMovie);

router.put('/:id', validateRequest({ params: IdParamSchema, body: MovieSchema }), updateMovie);

router.delete('/:id', validateRequest({ params: IdParamSchema }), removeMovie);

export default router;
