import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import type { User, WatchListItem } from '@prisma/client';
import {
  makeTestApp,
  authCookie,
  prismaError,
  expectError,
} from '../helpers.js';

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

let ctx: ReturnType<typeof makeTestApp>;
let api: ReturnType<typeof request.agent>;

beforeEach(() => {
  ctx = makeTestApp();
  ctx.prisma.user.findUnique.mockResolvedValue(makeUser());
  api = request.agent(ctx.app).set('Cookie', authCookie(USER_ID));
});

const protectedRoutes = [
  ['get', '/watchlist'],
  ['get', `/watchlist/${ITEM_ID}`],
  ['post', '/watchlist'],
  ['put', `/watchlist/${ITEM_ID}`],
  ['delete', `/watchlist/${ITEM_ID}`],
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

describe('GET /watchlist/:id', () => {
  it('400s when id is not a UUID', async () => {
    await api.get('/watchlist/not-a-uuid').expect(400);
  });

  it('404s when the item does not exist', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(null);
    const res = await api.get(`/watchlist/${ITEM_ID}`);

    expectError(res, 404, 'Watchlist item not found');
  });

  it('403s when the item belongs to someone else', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(
      makeItem({ userId: randomUUID() })
    );
    const res = await api.get(`/watchlist/${ITEM_ID}`);
    expectError(res, 403, 'Not allowed to modify this item');
  });

  it('200s and returns properly formatted response with the item when the user owns it', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(makeItem());
    const res = await api.get(`/watchlist/${ITEM_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data.watchListItem.id).toBe(ITEM_ID);
    expect(res.headers['content-type']).toEqual(
      expect.stringContaining('json')
    );
  });
});

describe('GET /watchlist', () => {
  it('200s when the user in the token is found in the db', async () => {
    ctx.prisma.watchListItem.findMany.mockResolvedValue([]);
    const res = await api.get('/watchlist');
    expect(ctx.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
    });
    expect(res.status).toBe(200);
  });

  it("200s and returns only the user's watchlist", async () => {
    const items = [makeItem()];
    ctx.prisma.watchListItem.findMany.mockResolvedValue(items);
    const res = await api.get('/watchlist').expect(200);

    expect(ctx.prisma.watchListItem.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
    });
    expect(res.body.data.watchlist).toHaveLength(1);
    expect(res.body.data.watchlist[0].id).toBe(ITEM_ID);
  });

  it('500s with a generic message when the database throws unexpectedly', async () => {
    ctx.prisma.watchListItem.findMany.mockRejectedValue(new Error('db down'));
    const res = await api.get('/watchlist');
    expectError(res, 500, 'Internal server error');
  });
});

describe('POST /watchlist', () => {
  const validBody = () => ({
    movieId: randomUUID(),
    status: 'PLANNED' as const,
    rating: 5,
    notes: 'looks good',
  });

  it.each([
    ['well-formed body', validBody()],
    ['id-only', { movieId: randomUUID() }]
  ])('201s on successful creation with %s', async (_label, body) => {
    // Create the returned object with the single body
    ctx.prisma.watchListItem.create.mockResolvedValue(makeItem(body));
    const res = await api.post('/watchlist').send(body).expect(201);

    expect(ctx.prisma.watchListItem.create).toHaveBeenCalledWith({
      data: { ...body, userId: USER_ID },
    });
    expect(res.body.data.watchListItem).toMatchObject({
      ...body,
      id: ITEM_ID,
      userId: USER_ID,
    });
  });

  it('404s when movie is not found', async () => {
    ctx.prisma.watchListItem.create.mockRejectedValue(prismaError('P2003'));
    const res = await api.post('/watchlist').send(validBody());

    expectError(res, 404, 'Movie not found');
  });

  it.each([
    ['non-uuid movieId', { movieId: 42 }],
    ['missing movieId', { movieId: undefined }],
    ['bad status', { movieId: randomUUID(), status: 'NOPE' }],
    ['rating is too high', { rating: 11 }],
    ['rating is not an int', { rating: 2.5 }],
    ['rating is not a number', { rating: 'seven' }],
    ['rating is too low', { rating: 0 }],
  ])('400s when %s', async (_label, override) => {
    await api
      .post('/watchlist')
      .send({ ...validBody(), ...override })
      .expect(400);

    expect(ctx.prisma.watchListItem.create).not.toHaveBeenCalled();
  });

  it('409s when the movie is already in the watchlist', async () => {
    ctx.prisma.watchListItem.create.mockRejectedValue(prismaError('P2002'));
    const res = await api.post('/watchlist').send(validBody());

    expectError(res, 409, 'Movie already in the watchlist');
  });
});

describe('PUT /watchlist/:id', () => {
  const fullUpdate = {
    status: 'WATCHING' as const,
    rating: 7,
    notes: 'halfway',
  };

  beforeEach(() => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(makeItem());
  });

  it.each([
    ['all fields are filled', fullUpdate],
    ['only status is provided', { status: 'COMPLETED' as const }],
    ['only rating is provided', { rating: 3 }],
    ['only notes is provided', { notes: 'meh' }],
  ])('200s with correctly formatted data where %s', async (_label, body) => {
    ctx.prisma.watchListItem.update.mockResolvedValue(makeItem(body));

    const res = await api.put(`/watchlist/${ITEM_ID}`).send(body).expect(200);

    expect(ctx.prisma.watchListItem.update).toHaveBeenCalledWith({
      where: { id: ITEM_ID },
      data: body,
    });
    expect(res.body.data.watchListItem).toMatchObject({ ...body, id: ITEM_ID });
  });

  it('strips movieId so it cannot be changed', async () => {
    ctx.prisma.watchListItem.update.mockResolvedValue(makeItem());
    await api
      .put(`/watchlist/${ITEM_ID}`)
      .send({ ...fullUpdate, movieId: randomUUID() })
      .expect(200);

    expect(ctx.prisma.watchListItem.update).toHaveBeenCalledWith({
      where: { id: ITEM_ID },
      data: fullUpdate,
    });
  });

  it('404s when watchlistItem does not exist', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(null);
    const res = await api.put(`/watchlist/${ITEM_ID}`).send(fullUpdate);

    expectError(res, 404, 'Watchlist item not found');
    expect(ctx.prisma.watchListItem.update).not.toHaveBeenCalled();
  });

  it('403s when the watchlistItem belongs to someone else', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(
      makeItem({ userId: randomUUID() })
    );
    const res = await api.put(`/watchlist/${ITEM_ID}`).send(fullUpdate);

    expectError(res, 403, 'Not allowed to modify this item');
    expect(ctx.prisma.watchListItem.update).not.toHaveBeenCalled();
  });

  it.each([
    ['bad status', { status: 'NOPE' }],
    ['rating is too high', { rating: 11 }],
    ['rating is too low', { rating: 0 }],
    ['rating of wrong type', { rating: '12' }],
    ['notes of wrong type', { notes: 12 }],
  ])('400s with malformed data such as %s', async (_label, override) => {
    api
      .put(`/watchlist/${ITEM_ID}`)
      .send({ ...fullUpdate, override })
      .expect(400);

    expect(ctx.prisma.watchListItem.update).not.toHaveBeenCalled();
  });

  it('400s when id is not a UUID', async () => {
    await api.put('/watchlist/not-a-uuid').expect(400);
  });
});

describe('DELETE /watchlist/:id', () => {
  it('404s if item does not exist', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(null);
    const res = await api.delete(`/watchlist/${ITEM_ID}`);

    expectError(res, 404, 'Watchlist item not found');
    expect(ctx.prisma.watchListItem.delete).not.toHaveBeenCalled();
  });

  it('403s if the watchlistItem belongs to someone else', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(
      makeItem({ userId: randomUUID() }) // random id to simulate a different user
    );
    const res = await api.delete(`/watchlist/${ITEM_ID}`);

    expectError(res, 403, 'Not allowed to modify this item');
    expect(ctx.prisma.watchListItem.delete).not.toHaveBeenCalled();
  });

  it('200s if the watchlistItem is deleted', async () => {
    ctx.prisma.watchListItem.findUnique.mockResolvedValue(makeItem());
    const res = await api.delete(`/watchlist/${ITEM_ID}`).expect(200);

    expect(ctx.prisma.watchListItem.delete).toHaveBeenCalledWith({
      where: { id: ITEM_ID },
    });
    expect(res.body).toEqual({
      status: 'success',
      data: { message: 'Movie removed from the watchlist' },
    });
  });

  it('400s when id is not a UUID', async () => {
    await api.delete('/watchlist/not-a-uuid').expect(400);
  });
});
