import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, BarChart3, FileText, Settings, ArrowLeft } from 'lucide-react';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-white">A</span>
          <span className="font-bold tracking-tight">Admin Panel</span>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <NavLink to="/app" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="h-3 w-3" /> Back to App
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}