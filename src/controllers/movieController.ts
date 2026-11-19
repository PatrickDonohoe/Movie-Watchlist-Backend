import type { Request, Response } from 'express';
import type { Movie } from '@prisma/client';
import { requireUser } from '../utils/requireUser.js';
import { sendSuccess } from '../utils/respond.js';
import type { ApiResponse } from '../types/api.js';
import type { MovieSubmit } from '../validators/movieValidators.js';
import type { MovieService } from '../services/movieService.js';

type MovieParams = { id: string };
type MovieData = { movie: Movie };
type MultMovieData = { movies: Movie[] };

export const createMovieController = (movieService: MovieService) => {
  const getMovies = async (
    req: Request<{}, ApiResponse<MultMovieData>>,
    res: Response<ApiResponse<MultMovieData>>
  ) => {
    const user = requireUser(req);

    const movies = await movieService.findMovieList(user.id);
    sendSuccess(res, { movies });
  };

  const getMovie = async (
    req: Request<MovieParams, ApiResponse<MovieData>>,
    res: Response<ApiResponse<MovieData>>
  ) => {
    const user = requireUser(req);
    const movie = await movieService.findMovie(req.params.id, user.id);

    return sendSuccess(res, { movie });
  };

  const addMovie = async (
    req: Request<{}, ApiResponse<MovieData>, MovieSubmit>,
    res: Response<ApiResponse<MovieData>>
  ) => {
    const user = requireUser(req);

    const movie = await movieService.createMovie(user.id, req.body);

    sendSuccess(res, { movie }, 201);
  };

  const updateMovie = async (
    req: Request<MovieParams, ApiResponse<MovieData>, MovieSubmit>,
    res: Response<ApiResponse<MovieData>>
  ) => {
    const user = requireUser(req);
    await movieService.findMovie(req.params.id, user.id);

    const movieItem = await movieService.modifyMovie(
      user.id,
      req.params.id,
      req.body
    );

    return sendSuccess(res, { movie: movieItem });
  };

  const removeMovie = async (
    req: Request<MovieParams>,
    res: Response<ApiResponse<{ message: string }>>
  ) => {
    const user = requireUser(req);
    await movieService.deleteMovie(user.id, req.params.id);

    return sendSuccess(res, { message: 'Movie successfully deleted.' });
  };

  return { getMovie, getMovies, addMovie, updateMovie, removeMovie };
};
