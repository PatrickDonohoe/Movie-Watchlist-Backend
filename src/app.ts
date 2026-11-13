import express from 'express';
import cookieParser from 'cookie-parser';
import type { PrismaClient } from '@prisma/client';

import { errorHandler } from './middleware/errorHandler.js';
import { createMovieRouter } from './routes/movieRoutes.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createWatchlistRouter } from './routes/watchlistRoutes.js';

export type AppDeps = { prisma: PrismaClient };

export const createApp = (deps: AppDeps) => {
  const app = express();

  // Body parsing middlewares - app.use indicates use of middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // for use of html forms, if used.
  app.use(cookieParser());
  
  // API Routes
  app.use('/movies', createMovieRouter(deps));
  app.use('/auth', createAuthRouter(deps));
  app.use('/watchlist', createWatchlistRouter(deps));
  app.use(errorHandler);

  return app;
}
