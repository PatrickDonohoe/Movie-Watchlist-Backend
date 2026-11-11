import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env.js';

export const setAuthCookie = (userId: string, res: Response) => {
  const token = jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  res.cookie('jwt', token, {
    ...cookieOptions,
    maxAge: env.JWT_EXPIRES_IN * 1000, // convert to ms for cookies
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

export const clearAuthCookie = (res: Response) =>
  res.clearCookie('jwt', cookieOptions);
