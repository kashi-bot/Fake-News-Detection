import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env';

export function signAccessToken(p: { sub: string; role: string }) {
  return jwt.sign({ ...p, type: 'access' }, env.JWT_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as any });
}

export function signRefreshToken(p: { sub: string; role: string }, remember?: boolean) {
  const days = remember ? env.REFRESH_TOKEN_TTL_DAYS : 1;
  return jwt.sign({ ...p, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: `${days}d` });
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
  if (payload.type !== 'refresh') throw new Error('wrong token type');
  return payload;
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
