import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Zap,
  ImageIcon,
  Globe,
  Layers,
  FileSearch,
  History,
  AlertCircle,
  Users,
  Settings2,
  ArrowRight,
  Link2,
  Sun,
  Moon,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface PublicStats {
  articlesAnalyzed: number;
  sourcesChecked: number;
  verificationsCompleted: number;
  usersProtected: number;
}

const FEATURES = [
  { icon: Zap, title: 'AI News Analysis', desc: 'Structured claim extraction and evidence-bound reasoning.' },
  { icon: Globe, title: 'Real-Time Source Verification', desc: 'Live queries across multiple news providers with failover.' },
  { icon: ImageIcon, title: 'Newspaper Image OCR', desc: 'Upload a photo or clipping and we extract the text.' },
  { icon: Link2, title: 'URL Verification', desc: 'Paste a link and we extract and check the article safely.' },
  { icon: Layers, title: 'Cross-Source Comparison', desc: 'Group related coverage and surface disagreements.' },
  { icon: ShieldCheck, title: 'Source Credibility', desc: 'Classified sources: official, established, or unknown.' },
  { icon: FileSearch, title: 'Evidence-Based Results', desc: 'Every verdict is backed by linked evidence cards.' },
  { icon: History, title: 'Verification History', desc: 'Save, review and export past investigations.' },
  { icon: AlertCircle, title: 'User Reports', desc: 'Report inaccuracies and help improve the system.' },
  { icon: Users, title: 'Admin Monitoring', desc: 'Provider health, audit logs, and platform analytics.' },
  { icon: Settings2, title: 'Configurable Pipeline', desc: 'AI and news providers configurable without code changes.' },
];

export default function Home() {
  const { user } = useAuth();

  // Theme state — same as AppShell so it's consistent
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

  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api<PublicStats>('/stats/public').catch(() => null),
    refetchInterval: 60_000,
    retry: false,
  });

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
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* News link */}
            <Link
              to="/news"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:flex dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Globe className="h-3.5 w-3.5" /> News
            </Link>

            {/* Auth state */}
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-transparent to-transparent dark:from-blue-950/20" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI-powered · Evidence-based · Explainable
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Verify Before
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              You Believe.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            AI-powered news verification using real-time sources, cross-source analysis, and explainable evidence.
          </p>

          {/* Three CTA buttons */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/app/verify" className="btn-primary">
              <ShieldCheck className="h-4 w-4" /> Verify News
            </Link>
            <Link to="/news" className="btn-secondary">
              <Globe className="h-4 w-4" /> Browse News
            </Link>
            <Link to="/app/verify" className="btn-secondary">
              <ImageIcon className="h-4 w-4" /> Upload News Image
            </Link>
          </div>
        </div>
      </section>

      {/* Live statistics */}
      <section className="border-y border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 sm:grid-cols-4">
          <Stat label="Articles analyzed" value={stats?.articlesAnalyzed} />
          <Stat label="Sources checked" value={stats?.sourcesChecked} />
          <Stat label="Verifications completed" value={stats?.verificationsCompleted} />
          <Stat label="Users protected" value={stats?.usersProtected} />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600 dark:text-slate-400">
          Six transparent steps from submission to an explainable result.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Submit news', 'Headline, article, URL, image or search.'],
            ['Extract content', 'OCR / article extraction / claim splitting.'],
            ['Search sources', 'Live queries with provider failover.'],
            ['Compare evidence', 'Dedup, ranking, publication-date analysis.'],
            ['AI reasoning', 'Evidence-bound analysis — no hallucinated sources.'],
            ['Show result', 'Verdict, confidence, claims, sources, limitations.'],
          ].map(([t, d], i) => (
            <li key={t} className="card">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                {i + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">Built for real verification</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <p className="text-center text-xs text-slate-500">
          TruthLens AI · Automated verification aid — not absolute proof of factuality.
        </p>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold tabular-nums tracking-tight">
        {value === undefined ? '—' : value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

function LiveNewsFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-news'],
    queryFn: () => api<{ articles: any[] }>('/news/search?q=world news').catch(() => ({ articles: [] })),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  const articles = (data?.articles ?? []).slice(0, 6);

  if (articles.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        >
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {a.sourceName || a.sourceDomain || 'News'}
            </span>
            <h3 className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {a.title}
            </h3>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : 'Recent'}
          </p>
        </a>
      ))}
    </div>
  );
}