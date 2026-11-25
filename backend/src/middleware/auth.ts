import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';

export interface AuthPayload { sub: string; role: string; type: 'access' }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: string; role: string; email: string; name: string } }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.access_token;
  if (!token) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required.'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    req.user = { id: payload.sub, role: payload.role, email: '', name: '' };
    next();
  } catch {
    next(new ApiError(401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.access_token;
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      req.user = { id: payload.sub, role: payload.role, email: '', name: '' };
    } catch { /* anonymous */ }
  }
  next();
}

const RANK: Record<string, number> = { user: 0, moderator: 1, admin: 2, superadmin: 3 };

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication required.'));
    const min = Math.min(...roles.map(r => RANK[r] ?? 99));
    if ((RANK[req.user.role] ?? -1) < min) {
      return next(new ApiError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    }
    next();
  };
}