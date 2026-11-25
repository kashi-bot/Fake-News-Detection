import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export function validate(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Parse and replace req.body with the validated/typed data
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new ApiError(400, 'VALIDATION_ERROR', message));
      }
      next(error);
    }
  };
}