import { NewsProvider, NewsSearchOptions, RawArticle } from './types';
import * as cheerio from 'cheerio';

const COUNTRY_MAP: Record<string, { hl: string, gl: string, ceid: string }> = {
  IN: { hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
  US: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  GB: { hl: 'en-GB', gl: 'GB', ceid: 'GB:en' },
};

// Map language codes to Google News locales
const LANG_MAP: Record<string, { hl: string, ceid: string }> = {
  en: { hl: 'en-IN', ceid: 'IN:en' },
  hi: { hl: 'hi-IN', ceid: 'IN:hi' },
  bn: { hl: 'bn-IN', ceid: 'IN:bn' },
  ta: { hl: 'ta-IN', ceid: 'IN:ta' },
  te: { hl: 'te-IN', ceid: 'IN:te' },
  mr: { hl: 'mr-IN', ceid: 'IN:mr' },
  gu: { hl: 'gu-IN', ceid: 'IN:gu' },
  kn: { hl: 'kn-IN', ceid: 'IN:kn' },
  ml: { hl: 'ml-IN', ceid: 'IN:ml' },
  pa: { hl: 'pa-IN', ceid: 'IN:pa' },
  ur: { hl: 'ur-IN', ceid: 'IN:ur' },
};

export class GoogleNewsRSSProvider implements NewsProvider {
  readonly name = 'googlenews';
  isConfigured() { return true; }

  async search(opts: NewsSearchOptions, signal?: AbortSignal): Promise<RawArticle[]> {
    const url = new URL('https://news.google.com/rss/search');
    
    let query = opts.query || 'news';
    if (opts.category && opts.category !== 'All' && opts.category !== 'Top Stories') {
      query += ` ${opts.category}`; 
    }
    
    url.searchParams.set('q', query);
    
    // Handle Country and Language
    const countryCode = opts.country || 'IN';
    const langCode = opts.language || 'en';
    
    const locale = COUNTRY_MAP[countryCode] || COUNTRY_MAP['IN'];
    const lang = LANG_MAP[langCode] || LANG_MAP['en'];
    
    url.searchParams.set('hl', lang.hl);
    url.searchParams.set('gl', locale.gl);
    url.searchParams.set('ceid', lang.ceid);

    url.searchParams.set('max', String(opts.max ?? 50));

    const res = await fetch(url.toString(), {
      signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });

    if (!res.ok) throw new Error(`Google News RSS error: ${res.status}`);

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const articles: RawArticle[] = [];
    $('item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('title').text();
      const link = $el.find('link').text();
      const pubDate = $el.find('pubDate').text();
      const source = $el.find('source').text();

      const cleanTitle = title.replace(` - ${source}`, '');

      articles.push({
        title: cleanTitle,
        description: cleanTitle,
        url: link,
        sourceName: source,
        sourceDomain: safeDomain(link),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    });

    return articles;
  }

  async health() {
    try {
      const r = await this.search({ query: 'India', max: 1 });
      return { ok: true, message: `${r.length} result(s)` };
    } catch (e: any) { return { ok: false, message: e?.message }; }
  }
}

function safeDomain(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return undefined; }
}