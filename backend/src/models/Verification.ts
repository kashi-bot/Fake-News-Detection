import { Schema, model, Types } from 'mongoose';

export const VERIFICATION_STATUSES = [
  'VERIFIED', 'LIKELY_AUTHENTIC', 'UNVERIFIED', 'MISLEADING',
  'LIKELY_FALSE', 'FALSE', 'INSUFFICIENT_EVIDENCE',
] as const;
export type VerificationStatus = typeof VERIFICATION_STATUSES[number];

const claimSchema = new Schema({
  text: String,
  status: { type: String, enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'CONTRADICTED', 'UNVERIFIED', 'MISLEADING'], default: 'UNVERIFIED' },
  confidence: Number,
  supportingRefs: [Number],   // indices into evidence[]
  contradictingRefs: [Number],
  note: String,
}, { _id: false });

const evidenceSchema = new Schema({
  title: String,
  description: String,
  url: String,
  sourceName: String,
  sourceDomain: String,
  sourceCategory: String,
  publishedAt: Date,
  author: String,
  imageUrl: String,
  relevance: Number,
  provider: String,
}, { _id: false });

const verificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  publicId: { type: String, unique: true, index: true },
  isPublic: { type: Boolean, default: false },

  inputType: { type: String, enum: ['headline', 'text', 'url', 'image', 'search', 'batch'], required: true, index: true },
  originalInput: String,
  extractedText: String,
  language: { type: String, default: 'en' },
  ocrConfidence: Number,
  metadata: { type: Schema.Types.Mixed, default: {} },

  stage: { type: String, default: 'queued' },
  error: { code: String, message: String },

  claims: { type: [claimSchema], default: [] },
  status: { type: String, enum: [...VERIFICATION_STATUSES, 'PROCESSING', 'FAILED'], default: 'PROCESSING', index: true },
  confidence: { type: Number, min: 0, max: 1 },
  summary: String,
  recommendation: String,
  limitations: { type: [String], default: [] },
  contradictions: { type: [String], default: [] },

  evidence: { type: [evidenceSchema], default: [] },
  timeline: { type: [{ at: Date, label: String, url: String, kind: String }], default: [] },
  sourceStats: {
    total: Number,
    official: Number,
    established: Number,
    unknown: Number,
  },
  recycled: {
    isRecycled: { type: Boolean, default: false },
    originalPublishedAt: Date,
    note: String,
  },
  methodology: { type: [String], default: [] },
  processingTimeMs: Number,
  aiMeta: {
    provider: String,
    model: String,
    tokens: Number,
    costEstimate: Number,
  },
}, { timestamps: true });

verificationSchema.index({ userId: 1, createdAt: -1 });
verificationSchema.index({ status: 1, createdAt: -1 });

export type VerificationDoc = InstanceType<typeof Verification>;
export const Verification = model('Verification', verificationSchema);