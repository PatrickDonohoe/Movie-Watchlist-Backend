import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

export const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }
    req.body = result.data; // replacing with the parsed/stripped version
    next();
  };
};
