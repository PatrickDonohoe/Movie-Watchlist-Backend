import { AppDeps } from '../app.js';
import { AppError } from '../utils/AppError.js';
import { MovieSubmit } from '../validators/movieValidators.js';

export const createMovieService = ({ prisma }: AppDeps) => {
  const findMovie = async (movieId: string, userId: string) => {
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new AppError('Movie not found.', 'NOT_FOUND');
    if (movie.createdBy !== userId)
      throw new AppError('Not allowed to modify this movie', 'FORBIDDEN');
    return movie;
  };

  const findMovieList = (userId: string) =>
    prisma.movie.findMany({ where: { createdBy: userId } });

  const createMovie = async (userId: string, input: MovieSubmit) => {
    return await prisma.movie.create({
      data: { ...input, createdBy: userId },
    });
  };

  const modifyMovie = async (
    userId: string,
    movieId: string,
    input: MovieSubmit
  ) => {
    await findMovie(movieId, userId);
    return await prisma.movie.update({ where: { id: movieId }, data: input });
  };

  const deleteMovie = async (userId: string, movieId: string) => {
    await findMovie(movieId, userId);
    return await prisma.movie.delete({ where: { id: movieId } });
  };

  return { findMovie, findMovieList, createMovie, modifyMovie, deleteMovie };
};

export type MovieService = ReturnType<typeof createMovieService>;
