import { NewsProvider, NewsSearchOptions, RawArticle } from './types';

const FIXTURES: RawArticle[] = [
  {
    title: 'Lashkar terrorist killed in encounter with security forces in Budgam',
    description: 'Security forces gunned down a Lashkar-e-Taiba militant during a joint encounter operation in Jammu and Kashmir\'s Budgam district.',
    url: 'https://indianexpress.com/article/india/lashkar-terrorist-killed-budgam-encounter',
    sourceName: 'The Indian Express',
    sourceDomain: 'indianexpress.com',
    publishedAt: new Date().toISOString(),
    author: 'Express News Service',
  },
  {
    title: 'LeT terrorist neutralized in Budgam encounter: Army',
    description: 'A Pakistan-based Lashkar-e-Taiba operative was killed in an encounter in central Kashmir\'s Budgam district.',
    url: 'https://www.ndtv.com/india-news/let-terrorist-budgam-encounter',
    sourceName: 'NDTV',
    sourceDomain: 'ndtv.com',
    publishedAt: new Date().toISOString(),
  }
];

export class MockNewsProvider implements NewsProvider {
  readonly name = 'mock';
  isConfigured() { return true; }

  async search(opts: NewsSearchOptions): Promise<RawArticle[]> {
    const q = opts.query.toLowerCase();
    
    // ONLY return fixtures if the query actually matches the fixtures
    if (q.includes('budgam') || q.includes('lashkar') || q.includes('encounter')) {
       return FIXTURES;
    }
    
    // If it's any other query, return empty so the app doesn't analyze fake data
    return [];
  }

  async health() { return { ok: true, message: 'fixture provider' }; }
}
