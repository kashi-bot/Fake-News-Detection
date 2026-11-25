import { NewsProvider, NewsSearchOptions, RawArticle } from './types';

export class NewsApiProvider implements NewsProvider {
  name = 'newsapi';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(opts: NewsSearchOptions, signal?: AbortSignal): Promise<RawArticle[]> {
    // ✅ FIXED: Added the correct path '/v2/everything'
    const url = new URL('https://newsapi.org/v2/everything');
    
    url.searchParams.set('q', opts.query);
    url.searchParams.set('language', opts.language ?? 'en');
    url.searchParams.set('sortBy', 'relevance');
    url.searchParams.set('pageSize', String(Math.min(opts.max ?? 20, 100)));
    url.searchParams.set('apiKey', this.apiKey);

    const res = await fetch(url.toString(), {
      signal,
      headers: { 'User-Agent': 'TruthLensAI/1.0' },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NewsAPI HTTP error ${res.status}: ${errText}`);
    }

    const json: any = await res.json();
    return (json.articles ?? []).map((a: any): RawArticle => ({
      title: a.title,
      description: a.description,
      url: a.url,
      sourceName: a.source?.name,
      publishedAt: a.publishedAt,
      imageUrl: a.urlToImage,
    }));
  }

  async health(): Promise<{ ok: boolean; message?: string }> {
    try {
      const articles = await this.search({ query: 'news', max: 1 });
      return { ok: true, message: `${articles.length} verified connection(s)` };
    } catch (e: any) {
      return { ok: false, message: e?.message };
    }
  }
}