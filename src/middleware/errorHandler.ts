import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import type { ErrorCode } from '../utils/AppError.js';

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(statusByCode[err.code]).json({
      status: 'error',
      error: { message: err.message, details: err.details },
    });
  }
  console.error(err);
  res
    .status(500)
    .json({ status: 'error', error: { message: 'Internal server error' } });
};
