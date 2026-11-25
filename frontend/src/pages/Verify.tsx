import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, FileText, Link as LinkIcon, Image as ImageIcon, Loader2, Sparkles, History } from 'lucide-react';
import { api } from '../lib/api';

const STAGES = [
  ['reading_content', 'Reading content'],
  ['extracting_claims', 'Extracting claims'],
  ['searching_sources', 'Searching news sources'],
  ['comparing_sources', 'Comparing sources'],
  ['checking_dates', 'Checking publication dates'],
  ['source_credibility', 'Analyzing source credibility'],
  ['ai_reasoning', 'Running AI reasoning'],
  ['generating_report', 'Generating final report'],
] as const;

type Mode = 'headline' | 'text' | 'url' | 'image';

export default function Verify() {
  const [mode, setMode] = useState<Mode>('headline');
  const [headline, setHeadline] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (mode !== 'image') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile();
          if (f) { e.preventDefault(); pickFile(f); return; }
        }
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [mode]);

  function pickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true); setStage('reading_content');

    try {
      let result;
      if (mode === 'headline') result = await api<{ id: string }>('/verify/headline', { method: 'POST', body: JSON.stringify({ headline, language }) });
      else if (mode === 'text') result = await api<{ id: string }>('/verify/text', { method: 'POST', body: JSON.stringify({ text, language }) });
      else if (mode === 'url') result = await api<{ id: string }>('/verify/url', { method: 'POST', body: JSON.stringify({ url, language }) });
      else {
        if (!file) throw new Error('Please choose an image first.');
        const fd = new FormData(); fd.append('image', file); fd.append('language', language);
        result = await api<{ id: string }>('/verify/image', { method: 'POST', body: fd });
      }
      navigate(`/app/result/${result.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Verification failed.');
      setBusy(false); setStage(null);
    }
  }

  const currentIdx = stage ? STAGES.findIndex(([k]) => k === stage) : -1;
  const MODES = [
    { id: 'headline', label: 'Headline', icon: Sparkles },
    { id: 'text', label: 'Article text', icon: FileText },
    { id: 'url', label: 'News URL', icon: LinkIcon },
    { id: 'image', label: 'Newspaper image', icon: ImageIcon },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      {/* New Gradient Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-2xl border border-blue-100 dark:border-blue-900">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" /> Verify News
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Submit a headline, URL, or photo. Our AI will cross-reference it against live sources.
          </p>
        </div>
        <Link to="/app/history" className="btn-secondary shrink-0 flex items-center gap-2">
          <History className="h-4 w-4" /> View History
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900/50">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id} onClick={() => setMode(m.id as Mode)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                mode === m.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" /> {m.label}
            </button>
          );
        })}
      </div>

      {/* Form Card */}
      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="space-y-6">
          {mode === 'headline' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">News Headline</label>
              <input value={headline} onChange={e => setHeadline(e.target.value)} required minLength={5}
                placeholder="e.g. Government introduces new law banning all social media platforms"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          )}

          {mode === 'text' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Article Text</label>
              <textarea value={text} onChange={e => setText(e.target.value)} required minLength={40} rows={8}
                placeholder="Paste the complete article here…"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          )}

          {mode === 'url' && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">News Article URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)} required type="url"
                placeholder="https://example.com/news/article"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              <p className="mt-2 text-xs text-slate-500">Note: Some publishers (like NYT, HT) block automated access. Use text mode instead.</p>
            </div>
          )}

          {mode === 'image' && (
            <div>
              <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] ?? null); }}
                className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:bg-slate-900">
                {preview ? (
                  <div className="space-y-4">
                    <img src={preview} alt="Preview" className="mx-auto max-h-64 rounded-lg object-contain shadow-sm" />
                    <button type="button" onClick={() => pickFile(null)} className="text-sm font-semibold text-red-500 hover:underline">Remove image</button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-4 font-medium text-slate-700 dark:text-slate-300">Drag & drop or paste (Ctrl+V) an image</p>
                    <p className="mt-1 text-xs text-slate-500">Newspaper clippings, screenshots, or social posts</p>
                    <label className="mt-6 inline-block cursor-pointer rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                      Browse Files
                      <input type="file" accept="image/*" className="sr-only" onChange={e => pickFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="ur">اردو (Urdu)</option>
            </select>
          </div>

          {error && <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>}

          <button type="submit" disabled={busy}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</> : <><ShieldCheck className="h-5 w-5 transition group-hover:scale-110" /> Verify Now</>}
          </button>
        </div>
      </form>

      {/* Progress UI */}
      {busy && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">AI Processing Pipeline</h3>
          <ol className="space-y-3">
            {STAGES.map(([key, label], i) => {
              const state = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending';
              return (
                <li key={key} className="flex items-center gap-4 text-sm font-medium">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                    state === 'done' ? 'bg-emerald-500 text-white' : state === 'active' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'
                  }`}>{state === 'done' ? '✓' : i + 1}</span>
                  <span className={state === 'pending' ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}>{label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}