const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

let accessToken: string | null = localStorage.getItem('tl_access') ?? null;

export function setAccessToken(t: string | null) {
  accessToken = t;
  if (t) localStorage.setItem('tl_access', t);
  else localStorage.removeItem('tl_access');
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, opts: RequestInit & { retry?: boolean } = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  if (!(opts.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${BASE}${path}`, { ...opts, headers, credentials: 'include' });

  if (res.status === 401 && opts.retry !== false) {
    // Try to refresh the token
    const r = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (r.ok) {
      const j = await r.json();
      setAccessToken(j?.data?.accessToken ?? null);
      return api<T>(path, { ...opts, retry: false });
    }
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(json?.error?.code ?? 'UNKNOWN', json?.error?.message ?? 'Request failed.', res.status);
  }
  return json.data as T;
}