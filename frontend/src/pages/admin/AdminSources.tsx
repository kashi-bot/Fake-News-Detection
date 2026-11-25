import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';

export default function AdminSources() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    domain: '',
    name: '',
    category: 'ESTABLISHED_PUBLISHER',
    isOfficial: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sources'],
    queryFn: () => api<any>('/admin/sources').catch(() => ({ items: [] })),
  });

  const create = useMutation({
    mutationFn: (body: any) =>
      api('/admin/sources', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sources'] });
      setForm({ domain: '', name: '', category: 'ESTABLISHED_PUBLISHER', isOfficial: false });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">News Sources</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold">Add a source</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="domain.com"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            placeholder="Publisher name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="ESTABLISHED_PUBLISHER">Established Publisher</option>
            <option value="SPECIALIZED_PUBLICATION">Specialized Publication</option>
            <option value="OFFICIAL_GOVERNMENT">Official Government</option>
            <option value="OFFICIAL_ORGANIZATION">Official Organization</option>
            <option value="UNKNOWN_PUBLISHER">Unknown</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isOfficial}
              onChange={(e) => setForm({ ...form, isOfficial: e.target.checked })}
            />
            Mark as official
          </label>
        </div>
        <button
          onClick={() => create.mutate(form)}
          disabled={!form.domain || !form.name}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
        >
          <Plus className="h-3.5 w-3.5" /> Add source
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950">
            <tr>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Official</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr><td colSpan={4} className="p-6 text-center text-slate-500">Loading…</td></tr>
            ) : data?.items?.length ? (
              data.items.map((s: any) => (
                <tr key={s._id}>
                  <td className="px-4 py-3 font-mono text-xs">{s.domain}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-xs">{s.category}</td>
                  <td className="px-4 py-3">{s.isOfficial ? '✓' : '—'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="p-6 text-center text-slate-500">No sources yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}