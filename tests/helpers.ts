import jwt from 'jsonwebtoken';
import { mockDeep } from 'vitest-mock-extended';
import { PrismaClient, Prisma } from '@prisma/client';
import { createApp } from '../src/app.js';
import { expect } from 'vitest';
import type { Response } from 'supertest';

export const makeTestApp = () => {
  const prisma = mockDeep<PrismaClient>();
  const app = createApp({ prisma });
  return { app, prisma };
};

export const authCookie = (userId: string) =>
  `jwt=${jwt.sign({ id: userId }, process.env.JWT_SECRET!)}`;

export const prismaError = (code: string) => 
  new Prisma.PrismaClientKnownRequestError('mock', { code, clientVersion: 'x' })

export const expectError = (res: Response, status: number, message: string) => {
  expect(res.status).toBe(status);
  expect(res.body).toEqual({ status: 'error', error: { message }})
}
