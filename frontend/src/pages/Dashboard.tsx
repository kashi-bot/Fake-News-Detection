import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, Activity, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<any>('/dashboard/stats').catch(() => ({ recent: [], totalVerifications: 0 }))
  });

  const stats = [
    { label: 'Total Verifications', value: data?.totalVerifications ?? 0, icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400' },
    { label: 'Recent Checks', value: data?.recent?.length ?? 0, icon: Clock, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400' },
    { label: 'Account Role', value: user?.role ?? 'user', icon: Activity, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* New Gradient Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-2xl border border-blue-100 dark:border-blue-900">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" /> Welcome back, {user?.name ?? 'User'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Here is what's happening with your fact-checks today.
          </p>
        </div>
        <Link to="/app/verify" className="btn-secondary shrink-0 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Verify News
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <Link to="/app/history" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">View All</Link>
        </div>
        <div className="p-2">
          {isLoading ? (
            <p className="p-4 text-sm text-slate-500">Loading…</p>
          ) : data?.recent?.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recent.map((v: any) => (
                <li key={v.id}>
                  <Link to={`/app/result/${v.id}`} className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {v.originalInput || v.extractedText || 'Untitled Verification'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(v.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      v.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 
                      v.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' : 
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {v.status?.replace(/_/g, ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">No verifications yet. Click "Verify News" to get started.</div>
          )}
        </div>
      </div>
    </div>
  );
}