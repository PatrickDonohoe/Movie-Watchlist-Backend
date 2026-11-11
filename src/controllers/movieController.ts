import type { Request, Response } from 'express';
import type { Movie } from '@prisma/client';
import { prisma } from '../config/db.js';
import { requireUser } from '../utils/requireUser.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/respond.js';
import type { ApiResponse } from '../types/api.js';
import type { MovieSubmit } from '../validators/movieValidators.js';

type MovieParams = { id: string };
type MovieData = { movie: Movie };
type MultMovieData = { movies: Movie[] };

const findMovie = async (movieId: string, userId: string) => {
  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) throw new AppError('Movie not found.', 404);
  if (movie.createdBy !== userId)
    throw new AppError('Not allowed to modify this movie', 403);
  return movie;
};

export const getMovies = async (
  req: Request<{}, ApiResponse<MultMovieData>>,
  res: Response<ApiResponse<MultMovieData>>
) => {
  const user = requireUser(req);

  const movies = await prisma.movie.findMany({
    where: { createdBy: user.id },
  });

  return sendSuccess(res, { movies });
};

export const getMovie = async (
  req: Request<MovieParams, ApiResponse<MovieData>>,
  res: Response<ApiResponse<MovieData>>
) => {
  const user = requireUser(req);
  const movie = await findMovie(req.params.id, user.id);

  return sendSuccess(res, { movie });
};

export const addMovie = async (
  req: Request<{}, ApiResponse<MovieData>, MovieSubmit>,
  res: Response<ApiResponse<MovieData>>
) => {
  const user = requireUser(req);

  const movie = await prisma.movie.create({
    data: {
      ...req.body,
      createdBy: user.id,
    },
  });

  res.status(201).json({
    status: 'success',
    data: { movie },
  });
};

export const updateMovie = async (
  req: Request<MovieParams, ApiResponse<MovieData>, MovieSubmit>,
  res: Response<ApiResponse<MovieData>>
) => {
  const user = requireUser(req);
  await findMovie(req.params.id, user.id);

  // const { title, overview, releaseYear, genres, runtime, posterUrl } = req.body;

  const movieItem = await prisma.movie.update({
    where: { id: req.params.id },
    data: req.body,
  });

  return sendSuccess(res, { movie: movieItem });
};

export const removeMovie = async (
  req: Request<MovieParams>,
  res: Response<ApiResponse<{ message: string }>>
) => {
  const user = requireUser(req);
  await findMovie(req.params.id, user.id);

  await prisma.movie.delete({ where: { id: req.params.id } });

  return sendSuccess(res, { message: 'Movie successfully deleted.' });
};
