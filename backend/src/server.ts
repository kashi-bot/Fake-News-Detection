import { createApp } from './app';
import { env } from './config/env';
import { connectDb } from './config/db';
import { logger } from './utils/logger';

async function main() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.PORT, () => logger.info({ port: env.PORT, env: env.NODE_ENV }, 'TruthLens API listening'));

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => { logger.error({ err }, 'fatal startup error'); process.exit(1); });