import { useQuery } from '@tanstack/react-query';
import { Users, ShieldCheck, AlertCircle, Activity } from 'lucide-react';
import { api } from '../../lib/api';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalVerifications: number;
  todayVerifications: number;
  openReports: number;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api<Stats>('/admin/stats'),
    refetchInterval: 30_000,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={data?.totalUsers ?? 0} sub={`${data?.activeUsers ?? 0} active`} color="blue" />
        <StatCard icon={ShieldCheck} label="Total Verifications" value={data?.totalVerifications ?? 0} sub={`${data?.todayVerifications ?? 0} today`} color="emerald" />
        <StatCard icon={AlertCircle} label="Open Reports" value={data?.openReports ?? 0} sub="Awaiting review" color="amber" />
        <StatCard icon={Activity} label="System Status" value="Healthy" sub="All providers online" color="emerald" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}