import { AiAnalysisOutput, EvidenceItem } from '../../providers/ai/types';
import { VerificationStatus, VERIFICATION_STATUSES } from '../../models/Verification';

const VALID_STATUS = new Set<string>(VERIFICATION_STATUSES);

/**
 * Hard gate: the model's output is never trusted verbatim.
 * Any citation index that does not exist in the retrieved evidence is dropped,
 * and any claim whose only support came from a fabricated citation is downgraded.
 */
export function validateAiOutput(raw: any, evidence: EvidenceItem[]): AiAnalysisOutput {
  const maxIdx = evidence.length - 1;
  const validRef = (n: any) => Number.isInteger(n) && n >= 0 && n <= maxIdx;

  const status: VerificationStatus = VALID_STATUS.has(raw?.overallStatus)
    ? raw.overallStatus
    : 'INSUFFICIENT_EVIDENCE';

  const claims = Array.isArray(raw?.claims) ? raw.claims.map((c: any) => {
    let supporting = Array.isArray(c.supportingRefs) ? c.supportingRefs.filter(validRef) : [];
    let contradicting = Array.isArray(c.contradictingRefs) ? c.contradictingRefs.filter(validRef) : [];

    let claimStatus = c.status;
    // If the model claimed support but every citation was fabricated, we cannot keep the status.
    if ((claimStatus === 'SUPPORTED' || claimStatus === 'PARTIALLY_SUPPORTED') && supporting.length === 0) {
      claimStatus = 'UNVERIFIED';
    }
    if (claimStatus === 'CONTRADICTED' && contradicting.length === 0) {
      claimStatus = 'UNVERIFIED';
    }

    return {
      text: String(c.text ?? '').slice(0, 1000),
      status: claimStatus,
      confidence: clamp01(Number(c.confidence) || 0),
      supportingRefs: supporting,
      contradictingRefs: contradicting,
      note: c.note ? String(c.note).slice(0, 500) : undefined,
    };
  }) : [];

  const citationsUsed = Array.isArray(raw?.citationsUsed)
    ? raw.citationsUsed.filter(validRef)
    : claims.flatMap((c: any) => [...c.supportingRefs, ...c.contradictingRefs]);

  const limitations: string[] = Array.isArray(raw?.limitations)
    ? raw.limitations.map((l: any) => String(l).slice(0, 400)).slice(0, 8)
    : [];

  // Evidence-count sanity caps: you cannot be highly confident on 0-1 sources.
  let confidence = clamp01(Number(raw?.confidence) || 0);
  if (evidence.length === 0) { confidence = Math.min(confidence, 0.2); }
  if (evidence.length < 3) { confidence = Math.min(confidence, 0.65); }

  return {
    overallStatus: evidence.length === 0 ? 'INSUFFICIENT_EVIDENCE' : status,
    confidence,
    summary: String(raw?.summary ?? '').slice(0, 2000) || 'No summary was produced.',
    recommendation: raw?.recommendation ? String(raw.recommendation).slice(0, 600) : undefined,
    claims,
    contradictions: Array.isArray(raw?.contradictions) ? raw.contradictions.map((s: any) => String(s).slice(0, 400)) : [],
    limitations,
    citationsUsed,
    recycled: raw?.recycled,
  };
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }