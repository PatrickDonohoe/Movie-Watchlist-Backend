import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import type { User, WatchListItem } from '@prisma/client';
import { makeTestApp, authCookie } from '../helpers.js';
import { Prisma } from '@prisma/client';

const USER_ID = randomUUID();
const ITEM_ID = randomUUID();

const makeUser = (o: Partial<User> = {}): User => ({
  id: USER_ID,
  email: 'a@b.com',
  name: 'Abe',
  password: 'hashed',
  createdAt: new Date(),
  ...o,
});

const makeItem = (o: Partial<WatchListItem> = {}): WatchListItem =>
  ({
    id: ITEM_ID,
    userId: USER_ID,
    movieId: randomUUID(),
    status: 'PLANNED',
    rating: null,
    notes: null,
    updatedAt: new Date(),
    ...o,
  }) as WatchListItem;

describe('GET /watchlist/:id', () => {
  let ctx: ReturnType<typeof makeTestApp>;

  beforeEach(() => {
    ctx = makeTestApp();
    ctx.prisma.user.findUnique.mockResolvedValue(makeUser());
  });

  it('401s without a token', async () => {
    const res = await request(ctx.app).get('/watchlist/abc');
    expect(res.status).toBe(401);
  });

  it('401s when the token user no longer exists', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(ctx.app)
      .get(`/watchlist/${ITEM_ID}`)
      .set('Cookie', authCookie(USER_ID));
    expect(res.status).toBe(401);
  });

  it('400s when id is not a UUID', async () => {
    await request(ctx.app)
      .get('/watchlist/not-a-uuid')
      .set('Cookie', authCookie(USER_ID))
      .expect(400);
  });

  it('404s when the item does not exist', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(null);
    const res = await request(ctx.app)
      .get(`/watchlist/${ITEM_ID}`)
      .set('Cookie', authCookie(USER_ID));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      error: { message: 'Watchlist item not found' },
    });
  });

  it('403s when the item belongs to someone else', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(
      makeItem({ userId: randomUUID() })
    );
    const res = await request(ctx.app)
      .get(`/watchlist/${ITEM_ID}`)
      .set('Cookie', authCookie(USER_ID));
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Not allowed to modify this item');
  });

  it('200s and returns properly formatted response with the item when the user owns it', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(makeItem());
    const res = await request(ctx.app)
      .get(`/watchlist/${ITEM_ID}`)
      .set('Cookie', authCookie(USER_ID));
    expect(res.status).toBe(200);
    expect(res.body.data.watchListItem.id).toBe(ITEM_ID);
    expect(res.headers['content-type']).toEqual(
      expect.stringContaining('json')
    );
  });
});

describe('GET /watchlist', async () => {
  let ctx: ReturnType<typeof makeTestApp>;

  beforeEach(() => {
    ctx = makeTestApp();
    ctx.prisma.user.findUnique.mockResolvedValue(makeUser());
  });

  it('200s when the user in the token is found in the db', async () => {
    ctx.prisma.watchListItem.findMany.mockResolvedValue([]);
    await request(ctx.app).get('/watchlist').set('Cookie', authCookie(USER_ID));
    expect(ctx.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
    });
  });
});

describe('POST /watchlist', () => {
  let ctx: ReturnType<typeof makeTestApp>;

  beforeEach(() => {
    ctx = makeTestApp();
    ctx.prisma.user.findUnique.mockResolvedValue(makeUser());
  });

  const validBody = () => ({
    movieId: randomUUID(),
    status: 'PLANNED' as const,
    rating: 5,
    notes: 'looks good',
  });

  it('201s on successful creation', async () => {
    const newBody = validBody(); // generate single body
    // Create the returned object with the single body
    ctx.prisma.watchListItem.create.mockResolvedValue(makeItem(newBody));
    const res = await request(ctx.app)
      .post('/watchlist')
      .set('Cookie', authCookie(USER_ID))
      .send(newBody)
      .expect(201);

    expect(ctx.prisma.watchListItem.create).toHaveBeenCalledWith({
      data: { ...newBody, userId: USER_ID },
    });
    expect(res.body.data.watchListItem).toMatchObject({
      ...newBody,
      id: ITEM_ID,
      userId: USER_ID,
    });
  });

  it('404s when movie is not found', async () => {
    ctx.prisma.watchListItem.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('fk', {
        code: 'P2003',
        clientVersion: 'x',
      })
    );
    const res = await request(ctx.app)
      .post('/watchlist')
      .set('Cookie', authCookie(USER_ID))
      .send(validBody())
      .expect(404);

    expect(res.body.error.message).toBe('Movie not found');
  });

  it.each([
    ['non-uuid movieId', { movieId: 42 }],
    ['missing movieId', { movieId: undefined }],
    ['bad status', { movieId: randomUUID(), status: 'NOPE' }],
    ['rating is too high', { rating: 11 }],
    ['rating is not an int', { rating: 2.5 }],
    ['rating is not a number', { rating: 'seven' }],
  ])('400s when %s', async (_label, override) => {
    await request(ctx.app)
      .post('/watchlist')
      .set('Cookie', authCookie(USER_ID))
      .send({ ...validBody(), ...override })
      .expect(400);

    expect(ctx.prisma.watchListItem.create).not.toHaveBeenCalled();
  });
});
