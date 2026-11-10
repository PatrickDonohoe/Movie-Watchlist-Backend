import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      error: { message: err.message, details: err.details },
    });
  }
  console.error(err);
  res
    .status(500)
    .json({ status: 'error', error: { message: 'Internal server error' } });
};
