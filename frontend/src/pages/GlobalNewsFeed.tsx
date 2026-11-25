import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Loader2, Globe, RefreshCw } from 'lucide-react';

const COUNTRIES = [
  { code: 'IN', label: '🇮🇳 India' }, { code: 'US', label: '🇺🇸 United States' }, { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'AU', label: '🇦🇺 Australia' }, { code: 'CA', label: '🇨🇦 Canada' }, { code: 'PK', label: '🇵🇰 Pakistan' },
  { code: 'BD', label: '🇧🇩 Bangladesh' }, { code: 'AE', label: '🇦🇪 UAE' }, { code: 'SG', label: '🇸🇬 Singapore' },
  { code: 'JP', label: '🇯🇵 Japan' }, { code: 'DE', label: '🇩🇪 Germany' }, { code: 'FR', label: '🇫🇷 France' },
];

const CATEGORIES = ['All', 'Politics', 'Technology', 'Business', 'Science', 'Health', 'Sports', 'Entertainment', 'World'];

export default function GlobalNewsFeed() {
  const [category, setCategory] = useState('All');
  const [country, setCountry] = useState('IN');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['global-news', category, country],
    // THIS IS THE FIX: /news/search instead of /news/world
    queryFn: () => api<any>(`/news/search?category=${category}&country=${country}`),
  });

  const articles = data?.articles || [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Global News Feed</h1>
            <p className="text-sm text-slate-500">Live headlines from trusted publishers. No login required.</p>
          </div>
        </div>
        <button onClick={() => refetch()} disabled={isRefetching} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Country Filter */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Country</p>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                country === c.code
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Category</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500 dark:border-slate-800">
          No articles found for {country} · {category}. Try another combination.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article: any, i: number) => (
            <a key={i} href={article.url} target="_blank" rel="noreferrer" className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase text-blue-600">{article.sourceName}</span>
              <h3 className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-100">{article.title}</h3>
              <p className="mt-auto pt-4 text-xs text-slate-500">{new Date(article.publishedAt).toLocaleDateString()}</p>
            </a>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 pt-8 text-center text-xs text-slate-500 dark:border-slate-800">
        TruthLens AI · Live headlines from Google News. Not editorial opinion.
      </div>
    </div>
  );
}