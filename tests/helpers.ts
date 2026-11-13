import jwt from 'jsonwebtoken';
import { mockDeep } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';

export const makeTestApp = () => {
  const prisma = mockDeep<PrismaClient>();
  const app = createApp({ prisma });
  return { app, prisma };
};

export const authCookie = (userId: string) =>
  `jwt=${jwt.sign({ id: userId }, process.env.JWT_SECRET!)}`;
