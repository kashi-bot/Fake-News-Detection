import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  History,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  MessageSquare,
  Globe, // <--- ADDED
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import FloatingChat from './FloatingChat';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/verify', label: 'Verify News', icon: ShieldCheck },
  { to: '/app/world-news', label: 'World News', icon: Globe }, // <--- ADDED
  { to: '/app/history', label: 'History', icon: History },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Back button inside the app → landing page (no intermediate history)
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/app')) {
        navigate('/', { replace: true });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // Theme handling
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

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) setUserMenuOpen(false);
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const isAdmin = ['moderator', 'admin', 'superadmin'].includes(user?.role ?? '');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              onClick={() => setOpen(o => !o)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/app" replace className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="font-bold tracking-tight">TruthLens AI</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <div className="relative" data-user-menu>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:pr-3"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </span>
                <span className="hidden text-xs font-medium text-slate-700 dark:text-slate-200 sm:inline">
                  {user?.name ?? 'User'}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="truncate text-sm font-semibold">{user?.name}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <NavLink to="/app" replace onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </NavLink>
                    <NavLink to="/app/history" replace onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <History className="h-4 w-4" /> My History
                    </NavLink>
                    <button onClick={() => { setUserMenuOpen(false); setChatOpen(true); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <MessageSquare className="h-4 w-4" /> AI Assistant
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="border-t border-slate-100 py-1 dark:border-slate-800">
                      <NavLink
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <ShieldCheck className="h-4 w-4" /> Admin Panel
                      </NavLink>
                    </div>
                  )}

                  <div className="border-t border-slate-100 py-1 dark:border-slate-800">
                    <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className={`${open ? 'block' : 'hidden'} w-full shrink-0 lg:block lg:w-56`}>
          <nav className="space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                replace
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <FloatingChat open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}