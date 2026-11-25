import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { validate } from '../middleware/validate';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/tokens';

const router = Router();

const strongPassword = z.string().min(10).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/);

// REGISTER
router.post('/register', validate(z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: strongPassword,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const exists = await User.exists({ email: email.toLowerCase() });
      if (exists) throw new ApiError(409, 'EMAIL_IN_USE', 'An account with that email already exists.');

      // Cast to any to bypass strict custom method typing
      const user: any = new User({ name, email, role: 'user', isVerified: true });
      await user.setPassword(password);
      await user.save();

      const accessToken = signAccessToken({ sub: String(user._id), role: user.role });
      const refreshToken = signRefreshToken({ sub: String(user._id), role: user.role }, true);

      user.sessions.push({ tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 86400000) });
      await user.save();

      res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth', maxAge: 30 * 86400000 });
      res.status(201).json({ success: true, data: { accessToken, user: { id: user._id, name, email, role: user.role } } });
    } catch (e) { next(e); }
  });

// LOGIN
router.post('/login', validate(z.object({ email: z.string().email(), password: z.string() })), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Cast to any to bypass strict custom method typing
    const user: any = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +sessions');
    
    if (!user || !user.isActive) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
    const ok = await user.verifyPassword(password);
    if (!ok) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');

    const accessToken = signAccessToken({ sub: String(user._id), role: user.role });
    const refreshToken = signRefreshToken({ sub: String(user._id), role: user.role }, true);

    user.sessions.push({ tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 86400000) });
    user.lastLoginAt = new Date();
    await user.save();

    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth', maxAge: 30 * 86400000 });
    res.json({ success: true, data: { accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } } });
  } catch (e) { next(e); }
});

// LOGOUT
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      const user: any = await User.findById(req.user!.id).select('+sessions');
      if (user) {
        user.sessions = user.sessions.filter((s: any) => s.tokenHash !== hashToken(token));
        await user.save();
      }
    }
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.json({ success: true, data: { loggedOut: true } });
  } catch (e) { next(e); }
});

// GET CURRENT USER
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id).lean();
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found.');
    res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

// REFRESH TOKEN
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No active session.');
    const payload = verifyRefreshToken(token);
    const user: any = await User.findById(payload.sub).select('+sessions');
    if (!user || !user.isActive) throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Session expired.');
    res.json({ success: true, data: { accessToken: signAccessToken({ sub: String(user._id), role: user.role }) } });
  } catch (e) { next(e); }
});

export default router;