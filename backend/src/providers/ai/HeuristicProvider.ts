import { AiProvider, AiAnalysisInput, AiAnalysisOutput, AiClaim } from './types';

export class HeuristicProvider implements AiProvider {
  readonly name = 'heuristic';
  readonly model = 'rule-based-v1';
  isConfigured() { return true; }

  async analyze(input: AiAnalysisInput): Promise<AiAnalysisOutput> {
    const ev = input.evidence;

    const claims: AiClaim[] = input.claims.map((c) => {
      const tokens = significant(c);
      const scored = ev.map((e, i) => ({ i, score: overlap(tokens, `${e.title} ${e.sourceName}`.toLowerCase()) }));
      const strong = scored.filter(s => s.score >= 0.5).map(s => s.i);
      const weak = scored.filter(s => s.score > 0.2 && s.score < 0.5).map(s => s.i);

      let status: AiClaim['status'] = 'UNVERIFIED';
      let confidence = 0.3;
      if (strong.length >= 2) { status = 'SUPPORTED'; confidence = 0.75; }
      else if (strong.length === 1 && weak.length >= 1) { status = 'PARTIALLY_SUPPORTED'; confidence = 0.55; }
      else if (strong.length === 1) { status = 'PARTIALLY_SUPPORTED'; confidence = 0.5; }

      return {
        text: c,
        status,
        confidence,
        supportingRefs: [...strong, ...weak].slice(0, 5),
        contradictingRefs: [],
        note: ev.length === 0 ? 'No matching coverage was retrieved.' : undefined,
      };
    });

    const supported = claims.filter(c => c.status === 'SUPPORTED').length;
    const partial = claims.filter(c => c.status === 'PARTIALLY_SUPPORTED').length;
    const total = claims.length || 1;

    let overallStatus: AiAnalysisOutput['overallStatus'] = 'INSUFFICIENT_EVIDENCE';
    let confidence = 0.25;

    if (ev.length === 0) {
      overallStatus = 'INSUFFICIENT_EVIDENCE';
      confidence = 0.2;
    } else if (supported / total >= 0.75) {
      overallStatus = 'VERIFIED'; confidence = 0.7;
    } else if ((supported + partial) / total >= 0.6) {
      overallStatus = 'LIKELY_AUTHENTIC'; confidence = 0.6;
    } else {
      overallStatus = 'UNVERIFIED'; confidence = 0.45;
    }

    return {
      overallStatus,
      confidence,
      summary: ev.length === 0
        ? 'No matching coverage was retrieved. This does not mean the claim is false — only that it could not be checked against the configured sources.'
        : 'Retrieved coverage does not fully confirm the claim. Review the linked sources for context.',
      recommendation: 'Cross-check the linked sources directly before acting on this story.',
      claims,
      contradictions: [],
      limitations: ev.length < 3 ? ['Fewer than three independent sources were retrieved, so confidence is capped.'] : [],
      citationsUsed: claims.flatMap(c => [...c.supportingRefs, ...c.contradictingRefs]),
    };
  }
}

function significant(s: string): string[] {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 3);
}
function overlap(a: string[], b: string): number {
  if (!a.length) return 0;
  const set = new Set(b.split(/\s+/));
  return a.filter(t => set.has(t)).length / a.length;
}