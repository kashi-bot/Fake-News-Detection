import type { VerificationResult } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Info, Calendar, ExternalLink, ShieldAlert, Bot } from 'lucide-react';

const STATUS_META: Record<string, { label: string; tone: string; icon: any; bg: string; text: string; border: string }> = {
  VERIFIED:            { label: 'Verified',              tone: 'emerald', icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900' },
  LIKELY_AUTHENTIC:    { label: 'Likely authentic',      tone: 'emerald', icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900' },
  UNVERIFIED:          { label: 'Unverified',            tone: 'amber',   icon: Info, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900' },
  MISLEADING:          { label: 'Misleading',            tone: 'amber',   icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900' },
  LIKELY_FALSE:        { label: 'Likely false',          tone: 'rose',    icon: XCircle, bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900' },
  FALSE:               { label: 'False',                 tone: 'rose',    icon: XCircle, bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900' },
  INSUFFICIENT_EVIDENCE:{ label: 'Insufficient evidence', tone: 'slate',  icon: ShieldAlert, bg: 'bg-slate-50 dark:bg-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' },
  FAILED:              { label: 'Failed',                tone: 'rose',    icon: XCircle, bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900' },
};

const CLAIM_TONE: Record<string, string> = {
  SUPPORTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
  PARTIALLY_SUPPORTED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
  CONTRADICTED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400',
  UNVERIFIED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MISLEADING: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-400',
};

export default function ResultView({ result }: { result: VerificationResult }) {
  const meta = STATUS_META[result.status] ?? STATUS_META.UNVERIFIED;
  const StatusIcon = meta.icon;
  const confidencePct = Math.round((result.confidence ?? 0) * 100);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Verdict Banner */}
      <section className={`rounded-3xl border ${meta.border} ${meta.bg} p-8 shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white shadow-sm dark:bg-slate-900 ${meta.text}`}>
              <StatusIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Result</p>
              <h1 className={`text-3xl font-extrabold tracking-tight ${meta.text}`}>{meta.label}</h1>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Confidence</p>
            <p className={`text-3xl font-extrabold ${meta.text}`}>{confidencePct}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/60 dark:bg-slate-950/50">
          <div className={`h-full rounded-full ${meta.text.replace('text-', 'bg-')}`} style={{ width: `${confidencePct}%` }} />
        </div>

        {/* AI Chat Bubble inside Banner */}
        <div className="mt-8 rounded-2xl bg-white/80 p-5 backdrop-blur-sm dark:bg-slate-900/80">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <p className="font-bold text-slate-900 dark:text-slate-100">TruthLens AI Assistant</p>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {result.summary || meta.label}
          </p>
        </div>
      </section>

      {/* Claim Analysis Table */}
      {result.claims.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Claim Analysis</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-4 font-semibold">Claim</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Sources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.claims.map((c, i) => (
                  <tr key={i} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-5 font-medium text-slate-900 dark:text-slate-100 max-w-md">{c.text}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${CLAIM_TONE[c.status] ?? CLAIM_TONE.UNVERIFIED}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                      {c.note && <p className="mt-2 text-xs text-slate-500">{c.note}</p>}
                    </td>
                    <td className="px-6 py-5 text-xs font-medium text-slate-500">
                      {c.supportingRefs.length + c.contradictingRefs.length} reference(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Evidence Cards (Sorted Newest First) */}
      {result.evidence.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Key Evidence</h2>
            <span className="text-xs font-medium text-slate-500">{result.evidence.length} sources checked</span>
          </div>
          <div className="p-6 grid gap-4 sm:grid-cols-2">
            {result.evidence.map((e, i) => (
              <div key={i} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-800">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {e.sourceName || e.sourceDomain}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {e.publishedAt ? new Date(e.publishedAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-3">
                  {e.title}
                </h3>
                <a href={e.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
                  Read Article <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Evidence Timeline (Chronological / Oldest First) */}
      {result.timeline.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Evidence Timeline</h2>
            <p className="text-xs text-slate-500 mt-1">Chronological progression of how the story was reported.</p>
          </div>
          <div className="p-6">
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 pb-4">
              {result.timeline.map((t, i) => (
                <div key={i} className="relative pl-6">
                  {/* Timeline Dot */}
                  <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${
                    t.kind === 'official' ? 'bg-blue-600' : t.kind === 'correction' ? 'bg-orange-500' : 'bg-slate-400'
                  }`} />
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {new Date(t.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <a href={t.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline dark:text-slate-100 dark:hover:text-blue-400">
                      {t.label}
                    </a>
                    <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider ${
                      t.kind === 'official' ? 'text-blue-600' : t.kind === 'correction' ? 'text-orange-600' : 'text-slate-400'
                    }`}>
                      {t.kind === 'official' ? 'Official Statement' : t.kind === 'correction' ? 'Correction' : 'News Report'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Methodology & Limitations */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">How this was determined</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            {result.methodology.map((m, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
          <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Limitations
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-amber-900/80 dark:text-amber-200/80">
            {result.limitations.length ? result.limitations.map((l, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>{l}</span>
              </li>
            )) : <li>No additional limitations were reported.</li>}
          </ul>
        </div>
      </section>

      <p className="text-center text-xs text-slate-400 pt-4">
        This report is an automated verification aid and should not be treated as absolute proof of factuality.
        {result.aiMeta?.provider && ` Analysis provider: ${result.aiMeta.provider} (${result.aiMeta.model}).`}
      </p>
    </div>
  );
}