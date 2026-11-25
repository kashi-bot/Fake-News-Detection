import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Globe,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const COUNTRIES = [
  { code: 'in', label: 'India', flag: '🇮🇳' },
  { code: 'us', label: 'United States', flag: '🇺🇸' },
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'au', label: 'Australia', flag: '🇦🇺' },
  { code: 'ca', label: 'Canada', flag: '🇨🇦' },
  { code: 'pk', label: 'Pakistan', flag: '🇵🇰' },
  { code: 'bd', label: 'Bangladesh', flag: '🇧🇩' },
  { code: 'lk', label: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'ae', label: 'UAE', flag: '🇦🇪' },
  { code: 'sg', label: 'Singapore', flag: '🇸🇬' },
  { code: 'jp', label: 'Japan', flag: '🇯🇵' },
  { code: 'de', label: 'Germany', flag: '🇩🇪' },
];

const CATEGORIES = [
  { code: 'all', label: 'All' },
  { code: 'politics', label: 'Politics' },
  { code: 'technology', label: 'Technology' },
  { code: 'business', label: 'Business' },
  { code: 'science', label: 'Science' },
  { code: 'health', label: 'Health' },
  { code: 'sports', label: 'Sports' },
  { code: 'entertainment', label: 'Entertainment' },
  { code: 'world', label: 'World' },
];

export default function NewsFeed() {
  const { user } = useAuth();
  const [country, setCountry] = useState('in');
  const [category, setCategory] = useState('all');

  // Theme handling — consistent with the rest of the app
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['public-news', country, category],
    queryFn: () => api<any>(`/news/world?country=${country}&category=${category}`),
    refetchInterval: 300_000, // refresh every 5 minutes
  });

  const articles = data?.articles ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-bold tracking-tight">TruthLens AI</span>
          </Link>

          <nav className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {user ? (
              <Link
                to="/app"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </span>
                <span className="text-xs font-medium">{user.name}</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !py-1.5 !text-xs">
                  Log in
                </Link>
                <Link to="/app/verify" className="btn-primary !py-1.5 !text-xs">
                  Verify News <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Title + refresh */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Globe className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Global News Feed</h1>
              <p className="text-sm text-slate-500">Live headlines from trusted publishers. No login required.</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Country filter */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Country</p>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  country === c.code
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {c.flag} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.code}
                onClick={() => setCategory(c.code)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  category === c.code
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <p className="text-sm text-slate-500">
              No articles found for {COUNTRIES.find(c => c.code === country)?.label} ·{' '}
              {CATEGORIES.find(c => c.code === category)?.label}
            </p>
            <p className="mt-2 text-xs text-slate-400">Try another country or category.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a: any, i: number) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {a.sourceName || a.sourceDomain || 'News'}
                </p>
                <h3 className="mt-1.5 line-clamp-3 text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {a.title}
                </h3>
                {a.description && a.description !== a.title && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.description}</p>
                )}
                {a.publishedAt && (
                  <p className="mt-auto pt-3 text-[10px] text-slate-400">
                    {new Date(a.publishedAt).toLocaleString()}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <p className="text-center text-xs text-slate-500">
          TruthLens AI · Live headlines from Google News. Not editorial opinion.
        </p>
      </footer>
    </div>
  );
}