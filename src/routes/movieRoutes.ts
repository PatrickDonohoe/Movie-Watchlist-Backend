import express from 'express';

import { createMovieController } from '../controllers/movieController.js';
import { MovieSchema } from '../validators/movieValidators.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';
import { IdParamSchema } from '../validators/commonValidators.js';
import type { AppDeps } from '../app.js';
import { createMovieService } from '../services/movieService.js';

export const createMovieRouter = (deps: AppDeps) => {
  const service = createMovieService(deps);
  const c = createMovieController(service);
  const router = express.Router();

  router.use(createAuthMiddleware(deps));

  router.get('/:id', validateRequest({ params: IdParamSchema }), c.getMovie);

  router.get('/', c.getMovies);

  router.post('/', validateRequest({ body: MovieSchema }), c.addMovie);

  router.put(
    '/:id',
    validateRequest({ params: IdParamSchema, body: MovieSchema }),
    c.updateMovie
  );

  router.delete(
    '/:id',
    validateRequest({ params: IdParamSchema }),
    c.removeMovie
  );
  return router;
};
