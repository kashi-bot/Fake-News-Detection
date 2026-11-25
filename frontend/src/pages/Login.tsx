import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Auto-redirect based on role after successful login
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    }
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setBusy(true);
  try {
    if (mode === 'login') {
      await login(email, password, true);
    } else {
      await register(name, email, password, confirmPassword);
    }
    navigate('/app', { replace: true }); // <-- was navigate('/app')
  } catch (err: any) {
    setError(err?.message ?? 'Something went wrong.');
  } finally {
    setBusy(false);
  }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">TruthLens AI</span>
        </Link>

        <div className="card">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setMode('login')}
              className={`rounded-md py-1.5 text-sm font-medium transition ${mode === 'login' ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'}`}
            >Log in</button>
            <button
              onClick={() => setMode('register')}
              className={`rounded-md py-1.5 text-sm font-medium transition ${mode === 'register' ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'}`}
            >Sign up</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Username</span>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required
                minLength={mode === 'register' ? 10 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              {mode === 'register' && (
                <p className="mt-1 text-xs text-slate-500">Min 10 chars with uppercase, lowercase and a number.</p>
              )}
            </label>
            {mode === 'register' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Confirm password</span>
                <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </label>
            )}

            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}