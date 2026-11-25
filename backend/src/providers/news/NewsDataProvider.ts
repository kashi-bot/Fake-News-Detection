import { NewsProvider, NewsSearchOptions, RawArticle } from './types';

export class NewsDataProvider implements NewsProvider {
  readonly name = 'newsdata';
  constructor(private apiKey: string) {}
  isConfigured() { return Boolean(this.apiKey); }

  async search(opts: NewsSearchOptions, signal?: AbortSignal): Promise<RawArticle[]> {
    const url = new URL('https://newsdata.io/api/1/news');
    url.searchParams.set('apikey', this.apiKey);
    url.searchParams.set('q', opts.query);
    url.searchParams.set('country', 'in'); // Focus on India
    url.searchParams.set('language', opts.language ?? 'en');
    
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error(`newsdata status error: ${res.status}`);
    const json: any = await res.json();
    
    return (json.results ?? []).map((a: any): RawArticle => ({
      title: a.title,
      description: a.description,
      url: a.link,
      sourceName: a.source_id,
      sourceDomain: safeDomain(a.link),
      publishedAt: a.pubDate,
      imageUrl: a.image_url,
    }));
  }

  async health() {
    try {
      const r = await this.search({ query: 'news', max: 1 });
      return { ok: true, message: `${r.length} result(s)` };
    } catch (e: any) { return { ok: false, message: e?.message }; }
  }
}

function safeDomain(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return undefined; }
}