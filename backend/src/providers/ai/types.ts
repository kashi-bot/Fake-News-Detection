import { VerificationStatus } from '../../models/Verification';

export interface EvidenceItem {
  index: number;
  title: string;
  url: string;
  sourceName: string;
  sourceCategory: string;
  publishedAt?: string;
}

export interface AiClaim {
  text: string;
  status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CONTRADICTED' | 'UNVERIFIED' | 'MISLEADING';
  confidence: number;
  supportingRefs: number[];
  contradictingRefs: number[];
  note?: string;
}

export interface AiAnalysisInput {
  content: string;
  claims: string[];
  evidence: EvidenceItem[];
  officialEvidence: EvidenceItem[];
  earliestPublication?: string;
  language: string;
}

export interface AiAnalysisOutput {
  overallStatus: VerificationStatus;
  confidence: number;
  summary: string;
  recommendation?: string;
  claims: AiClaim[];
  contradictions: string[];
  limitations: string[];
  citationsUsed: number[];      // evidence indices the model actually referenced
  recycled?: { isRecycled: boolean; originalPublishedAt?: string; note?: string };
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  analyze(input: AiAnalysisInput): Promise<AiAnalysisOutput>;
}