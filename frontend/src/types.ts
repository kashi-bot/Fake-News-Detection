export type VerificationStatus =
  | 'VERIFIED'
  | 'LIKELY_AUTHENTIC'
  | 'UNVERIFIED'
  | 'MISLEADING'
  | 'LIKELY_FALSE'
  | 'FALSE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'PROCESSING'
  | 'FAILED';

export type ClaimStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONTRADICTED'
  | 'UNVERIFIED'
  | 'MISLEADING';

export interface Evidence {
  title: string;
  description?: string;
  url: string;
  sourceName?: string;
  sourceDomain?: string;
  sourceCategory?: string;
  publishedAt?: string;
  author?: string;
  imageUrl?: string;
  relevance?: number;
  provider?: string;
}

export interface Claim {
  text: string;
  status: ClaimStatus;
  confidence?: number;
  supportingRefs: number[];
  contradictingRefs: number[];
  note?: string;
}

export interface TimelineEntry {
  at: string;
  label: string;
  url: string;
  kind: 'report' | 'official' | 'correction';
}

export interface SourceStats {
  total: number;
  official: number;
  established: number;
  unknown: number;
}

export interface VerificationResult {
  id: string;
  publicId: string;
  isPublic: boolean;
  inputType: 'headline' | 'text' | 'url' | 'image' | 'search' | 'batch';
  originalInput?: string;
  extractedText?: string;
  ocrConfidence?: number;
  language?: string;
  status: VerificationStatus;
  confidence?: number;
  summary?: string;
  recommendation?: string;
  claims: Claim[];
  contradictions: string[];
  limitations: string[];
  evidence: Evidence[];
  timeline: TimelineEntry[];
  sourceStats?: SourceStats;
  recycled?: { isRecycled: boolean; originalPublishedAt?: string; note?: string };
  methodology: string[];
  aiMeta?: { provider?: string; model?: string; tokens?: number; costEstimate?: number };
  processingTimeMs?: number;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  isVerified?: boolean;
}