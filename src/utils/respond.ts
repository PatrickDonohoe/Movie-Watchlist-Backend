import type { Response } from 'express';
import type { ApiResponse } from '../types/api.js';

export const sendSuccess = <T>(
  res: Response<ApiResponse<T>>,
  data: T,
  statusCode = 200
) => res.status(statusCode).json({ status: 'success', data });

export const sendError = <T>(
  res: Response<ApiResponse<T>>,
  message: string,
  statusCode = 400,
  deatils?: unknown
) =>
  res.status(statusCode).json({ status: 'error', error: { message, deatils } });
