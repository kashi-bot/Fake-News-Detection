import { RawArticle } from '../../providers/news/types';

export interface NormalizedArticle extends RawArticle {
  normalizedTitle: string;
  domain: string;
  publishedAtDate?: Date;
  relevance: number;
  provider: string;
}

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'was', 'were', 'by', 'at', 'as', 'from', 'that', 'this', 'it', 'its']);

export function normalizeTitle(t: string): string {
  return t.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w && !STOP.has(w))
    .sort()
    .join(' ');
}

export function tokens(s: string): Set<string> {
  return new Set(s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)));
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function dedupe(articles: RawArticle[]): RawArticle[] {
  const seenUrl = new Set<string>();
  const out: RawArticle[] = [];
  for (const a of articles) {
    const key = a.url.split('?')[0].replace(/\/$/, '').toLowerCase();
    if (seenUrl.has(key)) continue;
    const dup = out.some(o => jaccard(tokens(o.title), tokens(a.title)) > 0.8);
    if (dup) continue;
    seenUrl.add(key);
    out.push(a);
  }
  return out;
}

export function rank(articles: RawArticle[], query: string, provider: string): NormalizedArticle[] {
  const q = tokens(query);
  return articles.map(a => {
    const titleSim = jaccard(q, tokens(a.title));
    const descSim = jaccard(q, tokens(a.description ?? '')) * 0.5;
    const recency = a.publishedAt
      ? Math.max(0, 1 - (Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0;
    const relevance = +(titleSim * 0.6 + descSim * 0.25 + recency * 0.15).toFixed(4);
    return {
      ...a,
      normalizedTitle: normalizeTitle(a.title),
      domain: a.sourceDomain ?? safeHost(a.url),
      publishedAtDate: a.publishedAt ? new Date(a.publishedAt) : undefined,
      relevance,
      provider,
    };
  }).sort((x, y) => y.relevance - x.relevance);
}

function safeHost(u: string) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }

export interface TimelineEntry { at: Date; label: string; url: string; kind: 'report' | 'official' | 'correction' }

export function buildTimeline(articles: NormalizedArticle[], officialDomains: Set<string>): TimelineEntry[] {
  return articles
    .filter(a => a.publishedAtDate)
    .sort((a, b) => a.publishedAtDate!.getTime() - b.publishedAtDate!.getTime())
    .map(a => ({
      at: a.publishedAtDate!,
      label: `${a.sourceName ?? a.domain}: ${a.title}`,
      url: a.url,
      kind: officialDomains.has(a.domain) ? 'official'
        : /\b(correction|corrected|clarification|update)\b/i.test(a.title) ? 'correction'
        : 'report',
    }));
}

export function groupAgreement(articles: NormalizedArticle[]): { clusters: number; largest: number } {
  const clusters: NormalizedArticle[][] = [];
  for (const a of articles) {
    const t = tokens(a.title);
    const hit = clusters.find(c => jaccard(tokens(c[0].title), t) > 0.45);
    if (hit) hit.push(a); else clusters.push([a]);
  }
  return { clusters: clusters.length, largest: Math.max(0, ...clusters.map(c => c.length)) };
}