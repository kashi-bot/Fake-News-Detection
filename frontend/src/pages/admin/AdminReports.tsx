import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function AdminReports() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => api<any>('/admin/reports').catch(() => ({ items: [] })),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports &amp; Complaints</h1>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : data?.items?.length ? (
        <ul className="space-y-3">
          {data.items.map((r: any) => (
            <li key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {r.status}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium">{r.type}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No reports yet.</p>
      )}
    </div>
  );
}