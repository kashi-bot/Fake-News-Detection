import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutDashboard, Users, ShieldCheck, Globe, AlertCircle,
  BarChart3, FileText, Settings, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/verifications', label: 'Verifications', icon: ShieldCheck },
  { to: '/admin/sources', label: 'News Sources', icon: Globe },
  { to: '/admin/reports', label: 'Reports', icon: AlertCircle },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/logs', label: 'Audit Logs', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Any back press from admin pages → landing page
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        navigate('/', { replace: true });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-600 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-bold">TruthLens Admin</span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:bg-red-950 dark:text-red-300">
              {user?.role}
            </span>
          </div>
          <Link
            to="/app"
            replace
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back to App
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 p-4">
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to} to={to} end={end} replace
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                             : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}