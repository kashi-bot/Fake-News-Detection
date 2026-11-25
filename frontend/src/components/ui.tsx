import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>;
}

export function Button({ children, onClick, variant = 'primary', className = '' }: any) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50';
  const styles = variant === 'primary' ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';
  return <button onClick={onClick} className={`${base} ${styles} ${className}`}>{children}</button>;
}

export function Input({ label, ...props }: any) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input {...props} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
    </label>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: string }) {
  const map: any = { emerald: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', rose: 'bg-rose-100 text-rose-800', slate: 'bg-slate-100 text-slate-700' };
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}