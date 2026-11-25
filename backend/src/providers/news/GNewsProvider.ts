import { NewsProvider, NewsSearchOptions, RawArticle } from './types';

export class GNewsProvider implements NewsProvider {
  readonly name = 'gnews';
  constructor(private apiKey: string) {}
  isConfigured() { return Boolean(this.apiKey); }

  async search(opts: NewsSearchOptions, signal?: AbortSignal): Promise<RawArticle[]> {
    const url = new URL('https://gnews.io/api/v4/search');
    url.searchParams.set('q', opts.query);
    url.searchParams.set('lang', opts.language ?? 'en');
    url.searchParams.set('max', String(Math.min(opts.max ?? 20, 100)));
    url.searchParams.set('apikey', this.apiKey);
    // ❌ REMOVED: url.searchParams.set("country", "in"); -- This causes the 400 error

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`gnews status error: ${res.status}`);
    const json: any = await res.json();
    return (json.articles ?? []).map((a: any): RawArticle => ({
      title: a.title,
      description: a.description,
      url: a.url,
      sourceName: a.source?.name,
      sourceDomain: safeDomain(a.url),
      publishedAt: a.publishedAt,
      imageUrl: a.image,
    }));
  }

  async health() {
    const started = Date.now();
    try {
      const r = await this.search({ query: 'news', max: 1 });
      return { ok: true, latencyMs: Date.now() - started, message: `${r.length} result(s)` };
    } catch (e: any) { return { ok: false, message: e?.message }; }
  }
}

function safeDomain(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return undefined; }
}