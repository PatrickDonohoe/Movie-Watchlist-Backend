import type { Request } from 'express';
import { AppError } from './AppError.js';

export const requireUser = (req: Pick<Request, 'user'>) => {
  if (!req.user) throw new AppError('Not authorized', 401);
  return req.user;
};
