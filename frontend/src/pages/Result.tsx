import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import ResultView from '../components/ResultView';
import type { VerificationResult } from '../types';

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['verification', id],
    queryFn: () => api<VerificationResult>(`/verify/${id}`),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) return <div className="grid place-items-center py-20 text-sm text-slate-500">Loading result…</div>;
  if (error) return (
    <div className="card text-center">
      <p className="text-sm text-red-600">{(error as Error).message}</p>
      <Link to="/app/verify" className="btn-primary mt-4 inline-flex">Try another verification</Link>
    </div>
  );
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Link to="/app/history"  replace className="text-sm text-slate-500 hover:underline">
        ← Back to history
      </Link>
      <ResultView result={data} />
    </div>
  );
}