import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function AdminLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => api<any>('/admin/logs'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <p className="text-sm text-slate-500">Every admin action is recorded here.</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : data?.items?.length ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.items.map((log: any) => (
              <li key={log._id} className="flex items-start gap-3 p-4 text-sm">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono dark:bg-slate-800">
                  {log.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <span className="font-medium">{log.adminId?.name ?? 'Admin'}</span>
                    {' '}performed <strong>{log.action}</strong>
                    {log.targetType && ` on ${log.targetType}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No admin actions recorded yet.</p>
        )}
      </div>
    </div>
  );
}