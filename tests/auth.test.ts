import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import type { User } from '@prisma/client';
import {
  makeTestApp,
  authCookie,
  expectError,
  prismaError,
} from './helpers.js';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

const USER_ID = randomUUID();

const makeUser = (o: Partial<User> = {}): User => ({
  id: USER_ID,
  email: 'a@b.com',
  name: 'Abe',
  password: 'hashed',
  createdAt: new Date(),
  ...o,
});

let ctx: ReturnType<typeof makeTestApp>;
let api: ReturnType<typeof request.agent>;

beforeEach(() => {
  ctx = makeTestApp();
  ctx.prisma.user.findUnique.mockResolvedValue(makeUser());
  api = request.agent(ctx.app).set('Cookie', authCookie(USER_ID));
});

describe('POST /auth/register', () => {
  const userData = {
    name: 'John',
    email: 'john.smith@example.com',
    password: 'password123',
  };
  it('201s when valid data is submitted', async () => {
    const { password: _password, ...created } = makeUser(userData);
    ctx.prisma.user.create.mockResolvedValue(created as User);
    const res = await api.post('/auth/register').send(userData).expect(201);

    expect(ctx.prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: userData.name,
        email: userData.email,
        password: expect.stringMatching(/^\$2[aby]\$10\$/),
      },
      omit: { password: true },
    });
    expect(res.body.data.user).toEqual({
      ...created,
      createdAt: created.createdAt.toISOString(),
    });
  });

  it.each([
    ['name', { email: userData.email, password: userData.password }],
    ['email', { name: userData.name, password: userData.password }],
    ['password', { name: userData.name, email: userData.email }],
  ])('400s when %s is missing', async (_label, body) => {
    await api.post('/auth/register').send(body).expect(400);

    expect(ctx.prisma.user.create).not.toHaveBeenCalled();
  });

  it('409s when the email already exists', async () => {
    ctx.prisma.user.create.mockRejectedValue(prismaError('P2002'));
    const res = await api.post('/auth/register').send(userData).expect(409);

    expectError(res, 409, 'User already exists with that email');
  });

  it('500s when an unexpected error occurs', async () => {
    ctx.prisma.user.create.mockRejectedValue('boom');
    await api.post('/auth/register').send(userData).expect(500);
  });
});

describe('POST /auth/login', () => {
  const credentials = { email: 'abe.lincoln@usa.gov', password: 'password123' };

  const storedUser = makeUser({
    email: credentials.email,
    password: bcrypt.hashSync(credentials.password, 4),
  });

  beforeEach(() => {
    ctx.prisma.user.findUnique.mockResolvedValue(storedUser);
  });

  it('200s, sets the jwt cookie, and returns the user without the password', async () => {
    const res = await api.post('/auth/login').send(credentials).expect(200);

    expect(ctx.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: credentials.email },
    });

    expect(res.body.data.user).toEqual({
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
    });

    expect(res.headers['set-cookie']?.[0]).toMatch(/^jwt=.+; .*HttpOnly/);
  });

  it('401s when the password is wrong', async () => {
    const res = await api
      .post('/auth/login')
      .send({ ...credentials, password: 'wrong-password' })
      .expect(401);

    expectError(res, 401, 'Invalid email or password');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('401s when no user has that email', async () => {
    ctx.prisma.user.findUnique.mockResolvedValue(null);
    const res = await api
      .post('/auth/login')
      .send({ ...credentials, email: 'wrong-email@gmail.com' })
      .expect(401);
    expectError(res, 401, 'Invalid email or password');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it.each([
    ['email', { password: credentials.password }],
    ['password', { email: credentials.email }],
    ['both', {}],
  ])('400s when %s is missing', async (_label, body) => {
    await api.post('/auth/login').send(body).expect(400);
    expect(ctx.prisma.user.create).not.toHaveBeenCalled();
  });
});

describe('POST /auth/logout', () => {
  it('200s and clears the jwt cookie', async () => {
    const res = await api
      .post('/auth/logout')
      .set('Cookie', 'jwt=some-token')
      .expect(200);

    expect(res.body.data).toEqual({ message: 'Logged out successfully' });

    const cookie = res.headers['set-cookie']?.[0];
    expect(cookie).toMatch(/^jwt=;/);
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(cookie).toMatch(/HttpOnly/);
  });

  it('200s even when no one is logged in', async () => {
    const res = await api.post('/auth/logout').expect(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^jwt=;/);
  });
});

describe('DELETE /auth/remove', () => {
  it('200s and removes the user', async () => {
    ctx.prisma.user.deleteMany.mockResolvedValue({ count: 1 });
    const res = await api.delete('/auth/remove').expect(200);

    expect(ctx.prisma.user.deleteMany).toHaveBeenCalledWith({
      where: { id: USER_ID },
    });
    expect(res.body.data.message).toEqual('User successfully removed.');

    const cookie = res.headers['set-cookie']?.[0];
    expect(cookie).toMatch(/^jwt=;/);
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(cookie).toMatch(/HttpOnly/);
  });

  it('401s without a valid token', async () => {
    const res = await request(ctx.app).delete('/auth/remove').expect(401);
    
    expect(ctx.prisma.user.deleteMany).not.toHaveBeenCalled();
    expectError(res, 401, 'Not authorized. No token provided.')
  });
});
