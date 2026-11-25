import { RawArticle, NewsProvider, NewsSearchOptions } from './types';
import { MockNewsProvider } from './MockNewsProvider';
import { GoogleNewsRSSProvider } from './GoogleNewsRSSProvider';
import { GNewsProvider } from './GNewsProvider';
import { NewsApiProvider } from './NewsApiProvider';
import { NewsDataProvider } from './NewsDataProvider';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { DuckDuckGoProvider } from './DuckDuckGoProvider';

const registry: Record<string, () => NewsProvider> = {
  mock: () => new MockNewsProvider(),
  gnews: () => new GNewsProvider(env.GNEWS_API_KEY!),
  googlenews: () => new GoogleNewsRSSProvider(),
  duckduckgo: () => new DuckDuckGoProvider(),
  newsapi: () => new NewsApiProvider(env.NEWSAPI_KEY!),
  newsdata: () => new NewsDataProvider(env.NEWSDATA_API_KEY!),
};

export interface ProviderStat { name: string; requests: number; failures: number; latencyMs: number; ok: boolean; }
const stats = new Map<string, ProviderStat>();

function statFor(name: string): ProviderStat {
  let s = stats.get(name);
  if (!s) { s = { name, requests: 0, failures: 0, latencyMs: 0, ok: true }; stats.set(name, s); }
  return s;
}

export function providerStats() { return [...stats.values()]; }

export class NewsRegistry {
  private providers: NewsProvider[];

  constructor() {
    this.providers = env.NEWS_PROVIDERS.split(',')
      .map(n => n.trim()).filter(Boolean)
      .map(n => registry[n]?.())
      .filter((p): p is NewsProvider => Boolean(p) && p!.isConfigured());

    if (this.providers.length === 0) this.providers = [new MockNewsProvider()];
    logger.info({ providers: this.providers.map(p => p.name) }, 'news providers initialized');
  }

  /** Ordered failover: first provider that returns results wins; all are tried until one succeeds. */
  async search(opts: NewsSearchOptions): Promise<{ articles: RawArticle[]; provider: string; degraded: boolean }> {
    const errors: string[] = [];
    for (const p of this.providers) {
      const s = statFor(p.name);
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), env.NEWS_TIMEOUT_MS);
      const started = Date.now();
      try {
        s.requests++;
        const articles = await p.search(opts, ac.signal);
        s.latencyMs = Date.now() - started;
        s.ok = true;
        if (articles.length > 0) {
          return { articles, provider: p.name, degraded: p.name !== this.providers[0].name };
        }
        errors.push(`${p.name}: 0 results`);
      } catch (err: any) {
        s.failures++;
        s.ok = false;
        s.latencyMs = Date.now() - started;
        errors.push(`${p.name}: ${err?.message ?? 'error'}`);
        logger.warn({ provider: p.name, err: err?.message }, 'news provider failed');
      } finally {
        clearTimeout(timer);
      }
    }
    logger.warn({ errors }, 'all news providers exhausted');
    return { articles: [], provider: 'none', degraded: true };
  }

  async health() {
    const out: Record<string, any> = {};
    for (const p of this.providers) {
      try { out[p.name] = await p.health(); } catch { out[p.name] = { ok: false }; }
    }
    return out;
  }
}

export const newsRegistry = new NewsRegistry();