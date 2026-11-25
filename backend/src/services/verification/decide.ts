import { VerificationStatus } from '../../models/Verification';
import { AiAnalysisOutput } from '../../providers/ai/types';

export function decideStatus(ai: AiAnalysisOutput, evidenceCount: number, officialCount: number): {
  status: VerificationStatus;
  confidence: number;
  adjustments: string[];
} {
  const adjustments: string[] = [];
  let status = ai.overallStatus;
  let confidence = ai.confidence;

  // No evidence → always INSUFFICIENT_EVIDENCE
  if (evidenceCount === 0) {
    if (status !== 'INSUFFICIENT_EVIDENCE') {
      adjustments.push('No sources were retrieved, so the verdict was reduced to INSUFFICIENT_EVIDENCE.');
    }
    return { status: 'INSUFFICIENT_EVIDENCE', confidence: Math.min(confidence, 0.2), adjustments };
  }

  // Soften FALSE/VERIFIED when evidence is thin
  if ((status === 'FALSE' || status === 'LIKELY_FALSE') && evidenceCount < 3) {
    status = 'UNVERIFIED';
    confidence = Math.min(confidence, 0.4);
    adjustments.push('Fewer than three independent sources; verdict softened to UNVERIFIED.');
  }

  if (status === 'VERIFIED' && evidenceCount < 2) {
    status = 'LIKELY_AUTHENTIC';
    confidence = Math.min(confidence, 0.55);
    adjustments.push('A single source is not enough for a VERIFIED verdict.');
  }

  // === NEW: Apply a per-verdict confidence ceiling ===
  // This is the key change — different verdicts have different maximum confidences.
  const CEILING: Record<VerificationStatus, number> = {
    VERIFIED: 0.98,              // Very high — multiple strong sources
    LIKELY_AUTHENTIC: 0.82,      // Can't go above 82% — by definition uncertain
    UNVERIFIED: 0.55,            // Neutral, low certainty
    MISLEADING: 0.78,
    LIKELY_FALSE: 0.82,
    FALSE: 0.98,
    INSUFFICIENT_EVIDENCE: 0.25,
  };

  const ceiling = CEILING[status] ?? 0.95;
  if (confidence > ceiling) {
    adjustments.push(`Confidence capped at ${Math.round(ceiling * 100)}% for a "${status}" verdict.`);
    confidence = ceiling;
  }

  // Official corroboration can lift confidence but only within the ceiling
  if (officialCount >= 2 && (status === 'VERIFIED' || status === 'LIKELY_AUTHENTIC' || status === 'FALSE')) {
    confidence = Math.min(confidence + 0.03, ceiling);
  }

  // Cap for low evidence counts
  if (evidenceCount < 3) confidence = Math.min(confidence, 0.65);

  return { status, confidence: +confidence.toFixed(2), adjustments };
}
