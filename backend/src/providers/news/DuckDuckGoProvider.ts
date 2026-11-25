import { NewsProvider, NewsSearchOptions, RawArticle } from './types';
import { search, SafeSearchType } from 'duck-duck-scrape';

export class DuckDuckGoProvider implements NewsProvider {
  readonly name = 'duckduckgo';
  isConfigured() { return true; }

  async search(opts: NewsSearchOptions): Promise<RawArticle[]> {
    try {
      const results = await search(opts.query, { safeSearch: SafeSearchType.MODERATE });
      
      return results.results.slice(0, opts.max ?? 10).map((r: any): RawArticle => ({
        title: r.title,
        description: r.description,
        url: r.url,
        sourceName: safeDomain(r.url),
        sourceDomain: safeDomain(r.url),
        publishedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('DuckDuckGo Search Failed:', e);
      return [];
    }
  }

  async health() { return { ok: true, message: 'DuckDuckGo is free and unlimited' }; }
}

function safeDomain(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return undefined; }
}