import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Loader2, Calendar, Globe, Flame, Landmark, Cpu, TrendingUp, FlaskConical, HeartPulse, Trophy, Clapperboard, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  { id: 'All', label: 'Top Stories', icon: Flame },
  { id: 'Politics', label: 'Politics', icon: Landmark },
  { id: 'Technology', label: 'Technology', icon: Cpu },
  { id: 'Business', label: 'Business', icon: TrendingUp },
  { id: 'Science', label: 'Science', icon: FlaskConical },
  { id: 'Health', label: 'Health', icon: HeartPulse },
  { id: 'Sports', label: 'Sports', icon: Trophy },
  { id: 'Entertainment', label: 'Entertainment', icon: Clapperboard },
];

const COUNTRIES = [
  { code: 'IN', label: '🇮🇳 India' }, { code: 'US', label: '🇺🇸 United States' }, { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'AU', label: '🇦🇺 Australia' }, { code: 'CA', label: '🇨🇦 Canada' }, { code: 'PK', label: '🇵🇰 Pakistan' },
  { code: 'BD', label: '🇧🇩 Bangladesh' }, { code: 'AE', label: '🇦🇪 UAE' }, { code: 'SG', label: '🇸🇬 Singapore' },
  { code: 'JP', label: '🇯🇵 Japan' }, { code: 'DE', label: '🇩🇪 Germany' }, { code: 'FR', label: '🇫🇷 France' },
  { code: 'IT', label: '🇮🇹 Italy' }, { code: 'ES', label: '🇪🇸 Spain' }, { code: 'BR', label: '🇧🇷 Brazil' },
  { code: 'MX', label: '🇲🇽 Mexico' }, { code: 'ZA', label: '🇿🇦 South Africa' }, { code: 'NZ', label: '🇳🇿 New Zealand' }
];

export default function WorldNews() {
  const [category, setCategory] = useState('All');
  const [country, setCountry] = useState('IN');
  const [exactDate, setExactDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['world-news', category, country, exactDate],
    queryFn: () => api<any>(`/news/search?category=${category}&country=${country}&exactDate=${exactDate}`),
  });

  const articles = data?.articles || [];
  const visibleArticles = articles.slice(0, visibleCount);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-2xl border border-blue-100 dark:border-blue-900">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-600" /> World News Explorer
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Discover live headlines and historical context from trusted global publishers.
          </p>
        </div>
        <button onClick={() => refetch()} disabled={isRefetching} className="btn-secondary shrink-0 flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh Feed
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
        
        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  category === cat.id
                    ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" /> {cat.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-2" />

        {/* Country & Date Row */}
        <div className="flex flex-wrap items-center gap-4 px-2 py-1">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-800/50">
            <Globe className="h-4 w-4 text-slate-400" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none dark:text-slate-200 cursor-pointer"
            >
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-800/50">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={exactDate}
              onChange={(e) => setExactDate(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none dark:text-slate-200 cursor-pointer"
            />
            {exactDate && (
              <button onClick={() => setExactDate('')} className="ml-1 text-xs text-red-500 hover:underline">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* News Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : visibleArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-200 dark:bg-slate-800">
            <Globe className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No articles found</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Try changing the country or category. Note: Live feeds usually only contain news from the last 7-14 days. If you selected an old date, there may be no results.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article: any, i: number) => (
            <a
              key={i} href={article.url} target="_blank" rel="noopener noreferrer"
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {article.sourceName || article.sourceDomain}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                  {article.title}
                </h3>
              </div>
              <p className="mt-5 text-xs font-medium text-slate-500">
                {new Date(article.publishedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </a>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {visibleCount < articles.length && (
        <div className="flex justify-center pt-8">
          <button onClick={() => setVisibleCount(v => v + 12)} className="btn-primary px-8 py-2.5 shadow-md">
            Load More Articles
          </button>
        </div>
      )}
    </div>
  );
}