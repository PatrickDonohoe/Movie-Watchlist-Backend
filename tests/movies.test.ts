import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import type { User, Movie } from '@prisma/client';
import {
  makeTestApp,
  authCookie,
  // prismaError,
  expectError,
} from './helpers.js';
import { randomUUID } from 'node:crypto';

const USER_ID = randomUUID();
const MOVIE_ID = randomUUID();

const makeUser = (o: Partial<User> = {}): User => ({
  id: USER_ID,
  email: 'a@b.com',
  name: 'Abe',
  password: 'hashed',
  createdAt: new Date(),
  ...o,
});

const makeMovie = (o: Partial<Movie> = {}): Movie =>
  ({
    id: MOVIE_ID,
    title: 'The Dirty Dozen',
    overview: null,
    releaseYear: 1978,
    genres: ['drama'],
    runtime: 136,
    posterUrl: 'www.moviePoster.com/dirtydozen',
    createdBy: USER_ID,
    createdAt: new Date(),
    ...o,
  }) as Movie;

let ctx: ReturnType<typeof makeTestApp>;
let api: ReturnType<typeof request.agent>;

beforeEach(() => {
  ctx = makeTestApp();
  ctx.prisma.user.findUnique.mockResolvedValue(makeUser());
  api = request.agent(ctx.app).set('Cookie', authCookie(USER_ID));
});

const protectedRoutes = [
  ['get', '/movies'],
  ['get', `/movies/${MOVIE_ID}`],
  ['post', '/movies'],
  ['put', `/movies/${MOVIE_ID}`],
  ['delete', `/movies/${MOVIE_ID}`],
] as const;

describe.each(protectedRoutes)('%s %s requires auth', (method, url) => {
  it('401s without a token', async () => {
    await request(ctx.app)[method](url).expect(401);
  });

  it('401s when the token user no longer exists', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(null);
    await api[method](url).expect(401);
  });
});

describe('GET /movies', () => {
  it("200s with valid session and returns only the user's movies", async () => {
    const movies = [makeMovie()];
    ctx.prisma.movie.findMany.mockResolvedValue(movies);
    const res = await api.get('/movies').expect(200);

    expect(ctx.prisma.movie.findMany).toHaveBeenCalledWith({
      where: { createdBy: USER_ID },
    });
    expect(res.body.data.movies).toHaveLength(1);
    expect(res.body.data.movies[0].id).toBe(MOVIE_ID);
    expect(res.body.data.movies[0].createdBy).toBe(USER_ID);
  });

  it('200s when no movies exist', async () => {
    ctx.prisma.movie.findMany.mockResolvedValue([]);
    const res = await api.get(`/movies`).expect(200);
    expect(ctx.prisma.movie.findMany).toHaveBeenCalled();
    expect(res.body.data.movies).toEqual([]);
  });

  it('500s with a generic message when the database throws unexpectedly', async () => {
    ctx.prisma.movie.findMany.mockRejectedValue(new Error('db down'));
    const res = await api.get('/movies');
    expectError(res, 500, 'Internal server error');
  });
});

describe('GET /movies/:id', () => {
  const movie1 = makeMovie({
    id: MOVIE_ID,
    createdBy: USER_ID,
  });

  it('200s when the movie exists and returns data', async () => {
    ctx.prisma.movie.findUnique.mockResolvedValue(movie1);
    const res = await api.get(`/movies/${MOVIE_ID}`).expect(200);

    // Must convert dates to a string when comparing against a JSON ojbect
    expect(res.body.data.movie).toEqual({
      ...movie1,
      createdAt: movie1.createdAt.toISOString(),
    });
  });

  it('404s when movie is not found', async () => {
    ctx.prisma.movie.findUnique.mockResolvedValue(null);
    const res = await api.get(`/movies/${MOVIE_ID}`);

    expectError(res, 404, 'Movie not found.');
  });

  it('403s when the movie belongs to someone else', async () => {
    ctx.prisma.movie.findUnique.mockResolvedValue(
      makeMovie({ createdBy: randomUUID() })
    );

    const res = await api.get(`/movies/${MOVIE_ID}`);
    expectError(res, 403, 'Not allowed to modify this movie');
  });
});

describe('POST /movies', () => {
  const validBody = () => ({
    title: 'The Dirty Dozen',
    overview: undefined,
    releaseYear: 1978,
    genres: ['drama'],
    runtime: 136,
    posterUrl: 'https://www.moviePoster.com/dirtydozen',
  });

  it('201s with well-formed body', async () => {
    const body1 = validBody();
    const created = makeMovie(body1);

    ctx.prisma.movie.create.mockResolvedValue(created);
    const res = await api.post('/movies').send(body1).expect(201);

    expect(ctx.prisma.movie.create).toHaveBeenCalledWith({
      data: { ...body1, createdBy: USER_ID },
    });
    expect(res.body.data.movie).toEqual({
      ...created,
      createdAt: created.createdAt.toISOString(),
    });
  });

  it.each([
    ['title is int', { title: 42 }],
    ['title is too short', { title: '' }],
    ['year is string', { releaseYear: 'Nineteen-TwentyTwo' }],
    ['genres is not an array', { genres: 'drama' }],
    ['runtime is string', { runtime: 'seventy-two minutes' }],
    ['url is string', { posterUrl: 'www.poster.com' }],
  ])('400s with malformed data such as %s', async (_label, override) => {
    await api
      .post('/movies')
      .send({ ...validBody(), ...override })
      .expect(400);
    expect(ctx.prisma.movie.create).not.toHaveBeenCalled();
  });
});

describe('PUT /movies/:id', () => {
  const fullUpdate = {
    title: 'The Matrix',
    overview: 'Movie about SE who saves the world',
    releaseYear: 1999,
    genres: ['drama', 'action', 'sci-fi'],
    runtime: 126,
    posterUrl: 'https://www.posterUrl.com/matrix',
  };
  it.each([
    ['all fields are filled', fullUpdate],
    [
      'only required fields',
      {
        title: 'The Matrix',
        releaseYear: 1999,
        genres: ['drama', 'action', 'sci-fi'],
      },
    ],
  ])('200s when %s', async (_label, body) => {
    ctx.prisma.movie.findUnique.mockResolvedValue(makeMovie());
    ctx.prisma.movie.update.mockResolvedValue(makeMovie(body));
    const res = await api.put(`/movies/${MOVIE_ID}`).send(body).expect(200);

    expect(ctx.prisma.movie.update).toHaveBeenCalledWith({
      where: { id: MOVIE_ID },
      data: body,
    });
    expect(res.body.data.movie).toMatchObject({ ...body, id: MOVIE_ID });
  });

  it('404s when movie is not found', async () => {
    ctx.prisma.movie.findUnique.mockResolvedValue(null);
    const res = await api.put(`/movies/${MOVIE_ID}`).send(fullUpdate);

    expectError(res, 404, 'Movie not found.');
    expect(ctx.prisma.movie.update).not.toHaveBeenCalled();
  });

  it('403s when the movie belongs to someone else', async () => {
    ctx.prisma.movie.findUnique.mockResolvedValue(
      makeMovie({ createdBy: randomUUID() })
    );

    const res = await api.put(`/movies/${MOVIE_ID}`).send(fullUpdate);
    expectError(res, 403, 'Not allowed to modify this movie');
    expect(ctx.prisma.movie.update).not.toHaveBeenCalled();
  });

  it.each([
    ['title is int', { title: 42 }],
    ['title is too short', { title: '' }],
    ['year is string', { releaseYear: 'Nineteen-TwentyTwo' }],
    ['genres is not an array', { genres: 'drama' }],
    ['runtime is string', { runtime: 'seventy-two minutes' }],
    ['url is string', { posterUrl: 'www.poster.com' }],
  ])('400s with malformed data such as %s', async (_label, override) => {
    ctx.prisma.movie.findUnique.mockResolvedValue(makeMovie());
    await api
      .put(`/movies/${MOVIE_ID}`)
      .send({ ...fullUpdate, ...override })
      .expect(400);
    expect(ctx.prisma.movie.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /movies/:id', () => {
  it('200s if the movie is deleted', async () => {
    ctx.prisma.movie.findUnique.mockResolvedValue(makeMovie());
    const res = await api.delete(`/movies/${MOVIE_ID}`).expect(200);

    expect(ctx.prisma.movie.delete).toHaveBeenCalledWith({
      where: { id: MOVIE_ID },
    });
    expect(res.body).toEqual({
      status: 'success',
      data: { message: 'Movie successfully deleted.' },
    });
  });

  it('403s if the movie belongs to a different user', async () => {
    ctx.prisma.movie.findUnique.mockResolvedValue(
      makeMovie({ createdBy: randomUUID() })
    );
    const res = await api.delete(`/movies/${MOVIE_ID}`).expect(403);

    expect(ctx.prisma.movie.delete).not.toHaveBeenCalled();
    expectError(res, 403, 'Not allowed to modify this movie');
  });

  it('404s if the movie does not exist', async () => {
    ctx.prisma.movie.findUnique.mockResolvedValue(null);
    const res = await api.delete(`/movies/${MOVIE_ID}`).expect(404);

    expect(ctx.prisma.movie.delete).not.toHaveBeenCalled();
    expectError(res, 404, 'Movie not found.');
  });
});
