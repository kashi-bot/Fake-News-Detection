import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';

import { env, isProd } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/error';
import { newsRegistry } from './providers/news/registry';

import authRoutes from './routes/auth.routes';
import verifyRoutes from './routes/verify.routes';
import newsRoutes from './routes/news.routes';
import historyRoutes from './routes/history.routes';
import reportsRoutes from './routes/reports.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import { Verification } from './models/Verification';
import { User } from './models/User';
import { NewsSource } from './models/NewsSource';
import chatRoutes from './routes/chat.routes';
import mongoose from 'mongoose';

export function createApp() {
  const app = express();
  
  app.set('trust proxy', 1);
  
  app.use(helmet({
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  
  app.use('/api', rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
  }));
  
  app.get('/api/health', async (_req, res) => {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const providers = await newsRegistry.health().catch(() => ({}));
    const healthy = dbState === 'connected';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      database: dbState,
      newsProviders: providers,
      uptimeSec: Math.round(process.uptime()),
    });
  });
  
  // Public platform statistics — real counts, no hard-coded numbers.
  app.get('/api/stats/public', async (_req, res, next) => {
    try {
      const [verifications, users, sourcesChecked] = await Promise.all([
        Verification.countDocuments({ status: { $ne: 'FAILED' } }),
        User.countDocuments({ isActive: true }),
        Verification.aggregate([{ $group: { _id: null, total: { $sum: '$sourceStats.total' } } }]),
      ]);
      res.json({
        success: true,
        data: {
          articlesAnalyzed: verifications,
          usersProtected: users,
          sourcesChecked: sourcesChecked[0]?.total ?? 0,
          verificationsCompleted: verifications,
        },
      });
    } catch (e) { next(e); }
  });
  
  app.use('/api/auth', authRoutes);
  app.use('/api/verify', verifyRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/news', newsRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin', adminRoutes);
  
  app.use(notFound);
  app.use(errorHandler);
  
  return app;
}