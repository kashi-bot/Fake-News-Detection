import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Input } from './ui';

export default function VerifyForm() {
  const [mode, setMode] = useState<'headline' | 'text' | 'url' | 'image'>('headline');
  const [headline, setHeadline] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setBusy(true);
    try {
      let result;
      if (mode === 'headline') result = await api<{ id: string }>('/verify/headline', { method: 'POST', body: JSON.stringify({ headline }) });
      else if (mode === 'text') result = await api<{ id: string }>('/verify/text', { method: 'POST', body: JSON.stringify({ text }) });
      else if (mode === 'url') result = await api<{ id: string }>('/verify/url', { method: 'POST', body: JSON.stringify({ url }) });
      else {
        if (!file) throw new Error('Please choose an image.');
        const fd = new FormData(); fd.append('image', file);
        result = await api<{ id: string }>('/verify/image', { method: 'POST', body: fd });
      }
      navigate(`/app/result/${result.id}`);
    } catch (err: any) { setError(err.message); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex gap-2">
        {(['headline', 'text', 'url', 'image'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-full px-3 py-1 text-xs font-medium ${mode === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{m}</button>
        ))}
      </div>
      {mode === 'headline' && <Input label="Headline" value={headline} onChange={(e: any) => setHeadline(e.target.value)} required />}
      {mode === 'text' && <textarea className="w-full rounded-lg border p-2 text-sm" rows={6} value={text} onChange={e => setText(e.target.value)} required />}
      {mode === 'url' && <Input label="URL" value={url} onChange={(e: any) => setUrl(e.target.value)} required />}
      {mode === 'image' && <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Verifying…' : 'Verify Now'}</Button>
    </form>
  );
}