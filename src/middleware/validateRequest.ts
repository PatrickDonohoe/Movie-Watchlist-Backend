import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

type Schemas = { body?: ZodType; params?: ZodType; query?: ZodType }

export const validateRequest = (schemas: Schemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const key of ['body', 'params', 'query'] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) throw new AppError(result.error.message, 400);

      if (key === 'query') {
        Object.defineProperty(req, 'query', { value: result.data })
      } else {
        req[key] = result.data;
      }
    }
    next();
  };
};
