import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { isProd } from '../config/env';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'NOT_FOUND', 'The requested resource was not found.'));
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const isApi = err instanceof ApiError;
  const status = isApi ? err.status : 500;
  const code = isApi ? err.code : 'INTERNAL_ERROR';
  const message = isApi ? err.message : 'Something went wrong on our end.';

  if (status >= 500) {
    logger.error({ err: err?.message, stack: isProd ? undefined : err?.stack, path: req.path, method: req.method }, 'request failed');
  }

  res.status(status).json({ success: false, error: { code, message } });
}