import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api<any>('/admin/analytics'),
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;

  const dist = data?.verdictDistribution ?? [];
  const total = dist.reduce((a: number, x: any) => a + x.count, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold">Verdict distribution</h2>
        {dist.length ? (
          <ul className="space-y-2">
            {dist.map((d: any) => (
              <li key={d.status} className="flex items-center gap-3">
                <span className="w-40 text-xs font-medium">{d.status}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full bg-blue-600" style={{ width: `${total ? (d.count / total) * 100 : 0}%` }} />
                </div>
                <span className="w-10 text-right text-xs tabular-nums">{d.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No verification data yet.</p>
        )}
      </div>
    </div>
  );
}