import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trash2, FileText, Link as LinkIcon, Image as ImageIcon, Sparkles, History as HistoryIcon } from 'lucide-react';
import { api } from '../lib/api';
import type { VerificationResult } from '../types';

const getTypeIcon = (type: string) => {
  if (type === 'url') return <LinkIcon className="h-4 w-4" />;
  if (type === 'image') return <ImageIcon className="h-4 w-4" />;
  if (type === 'text') return <FileText className="h-4 w-4" />;
  return <Sparkles className="h-4 w-4" />;
};

export default function History() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => api<{ items: VerificationResult[] }>('/history').catch(() => ({ items: [] })),
  });

  const items = data?.items ?? [];

  async function clearAll() {
    if (!confirm('Delete ALL your verification history? This cannot be undone.')) return;
    try {
      await api('/history/clear', { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['history'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (e: any) {
      alert(`Failed to clear: ${e.message}`);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* New Gradient Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-2xl border border-blue-100 dark:border-blue-900">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HistoryIcon className="h-6 w-6 text-blue-600" /> Verification History
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Every check you've run, saved to your account.
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={clearAll} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            <Trash2 className="h-4 w-4" /> Clear History
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-slate-500">No verifications yet.</p>
            <Link to="/app/verify" className="mt-4 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">Run a verification</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-4 font-semibold">Input / Content</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Confidence</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((v) => (
                  <tr key={v.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                          {getTypeIcon(v.inputType)}
                        </div>
                        <div className="min-w-0 max-w-[250px] lg:max-w-md">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {v.originalInput || v.extractedText?.slice(0, 80) || 'Untitled'}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">{v.inputType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        v.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                        v.status === 'LIKELY_FALSE' || v.status === 'FALSE' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {v.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {v.confidence !== undefined ? `${Math.round(v.confidence * 100)}%` : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/app/result/${v.id}`} className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}