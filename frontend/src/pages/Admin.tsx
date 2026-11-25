import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Admin() {
  const { pathname } = useLocation();
  const nav = [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/logs', label: 'Logs' },
  ];
  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl gap-6">
        <aside className="w-48 shrink-0 space-y-1">
          <Link to="/" className="mb-4 block text-sm font-bold">← Back to App</Link>
          {nav.map(n => (
            <Link key={n.to} to={n.to} className={`block rounded px-3 py-2 text-sm ${pathname === n.to ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{n.label}</Link>
          ))}
        </aside>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}