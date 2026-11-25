import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAccessToken } from './api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<User>('/auth/me', { retry: false });
        setUser(me);
      } catch {
        try {
          const r = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (r.ok) {
            const j = await r.json();
            setAccessToken(j?.data?.accessToken ?? null);
            const me = await api<User>('/auth/me');
            setUser(me);
          }
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string, remember = false) {
    const r = await api<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    });
    setAccessToken(r.accessToken);
    setUser(r.user);
  }

  async function register(name: string, email: string, password: string, confirmPassword: string) {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    await login(email, password);
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  }

  async function refresh() {
    const me = await api<User>('/auth/me');
    setUser(me);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}