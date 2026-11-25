import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/truthlens'),

  JWT_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().default(false),

  // THIS IS THE LINE THAT FIXES YOUR ERROR
  AI_PROVIDER: z.enum(['heuristic', 'openai', 'groq']).default('groq'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('qwen/qwen3.8-27b'),
  AI_MAX_TOKENS: z.coerce.number().default(2500),
  AI_TIMEOUT_MS: z.coerce.number().default(45000),

  // ONLY ONE DEFINITION OF GROQ_API_KEY
 
  NEWS_PROVIDERS: z.string().default('googlenews,mock'),
  GNEWS_API_KEY: z.string().optional(),
  NEWSAPI_KEY: z.string().optional(),
  NEWSDATA_API_KEY: z.string().optional(),
  NEWS_TIMEOUT_MS: z.coerce.number().default(8000),
  NEWS_MAX_ARTICLES: z.coerce.number().default(30),

  OCR_PROVIDER: z.enum(['tesseract']).default('tesseract'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(10 * 1024 * 1024),
  VERIFY_CACHE_TTL_SEC: z.coerce.number().default(900),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:\n' + parsed.error.issues.map(i => ` - ${i.message}`).join('\n'));
  process.exit(1);
}
export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

console.log('=== ENV LOADED ===');
console.log('AI_PROVIDER:', env.AI_PROVIDER);
console.log('AI_MODEL:', env.AI_MODEL);
console.log('NEWS_PROVIDERS:', env.NEWS_PROVIDERS);
console.log('GROQ_API_KEY starts with gsk_:', env.GROQ_API_KEY.startsWith('gsk_'));
console.log('==================');