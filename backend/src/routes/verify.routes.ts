import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { runVerification, PipelineInput } from '../services/verification/pipeline';
import { extractFromUrl } from '../services/urlExtract';
import { runOcr } from '../providers/ocr/TesseractProvider';
import { Verification } from '../models/Verification';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { subscribe } from '../services/jobs';

const router = Router();
const limiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new ApiError(415, 'UNSUPPORTED_FILE', 'Only JPG, PNG, WEBP or TIFF images are supported.'));
    }
    cb(null, true);
  },
});

const baseSchema = z.object({
  language: z.string().min(2).max(5).optional(),
  headline: z.string().min(5).max(500).optional(),
});

router.post('/headline', limiter, optionalAuth, validate(z.object({
  headline: z.string().min(5).max(500),
  language: z.string().min(2).max(5).optional(),
})), async (req, res, next) => {
  try {
    const input: PipelineInput = {
      inputType: 'headline',
      text: req.body.headline,
      originalInput: req.body.headline,
      language: req.body.language,
    };
    const doc = await runVerification(input, req.user?.id);
    res.status(201).json({ success: true, data: serialize(doc) });
  } catch (e) { next(e); }
});

router.post('/text', limiter, optionalAuth, validate(z.object({
  text: z.string().min(40).max(50000),
  language: z.string().min(2).max(5).optional(),
})), async (req, res, next) => {
  try {
    const doc = await runVerification({
      inputType: 'text', text: req.body.text, originalInput: req.body.text.slice(0, 500),
      language: req.body.language,
    }, req.user?.id);
    res.status(201).json({ success: true, data: serialize(doc) });
  } catch (e) { next(e); }
});

router.post('/url', limiter, optionalAuth, validate(z.object({
  url: z.string().url(),
  language: z.string().min(2).max(5).optional(),
})), async (req, res, next) => {
  try {
    const page = await extractFromUrl(req.body.url);
    const doc = await runVerification({
      inputType: 'url',
      text: `${page.headline}\n\n${page.text}`,
      originalInput: req.body.url,
      language: req.body.language ?? page.language,
      metadata: {
        canonicalUrl: page.canonicalUrl, author: page.author, publisher: page.publisher,
        publishedAt: page.publishedAt?.toISOString(),
      },
    }, req.user?.id);
    res.status(201).json({ success: true, data: serialize(doc) });
  } catch (e) { next(e); }
});

router.post('/image', limiter, optionalAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'NO_FILE', 'Please attach an image.');
    const language = (req.body.language as string) || 'en';
    const ocr = await runOcr(req.file.buffer, language);
    const doc = await runVerification({
      inputType: 'image',
      text: ocr.text,
      originalInput: req.file.originalname,
      language,
      ocrConfidence: ocr.confidence,
      metadata: { ocrLowConfidence: ocr.lowConfidence, bytes: req.file.size, mime: req.file.mimetype },
    }, req.user?.id);
    res.status(201).json({
      success: true,
      data: { ...serialize(doc), ocr: { confidence: ocr.confidence, lowConfidence: ocr.lowConfidence, text: ocr.text.slice(0, 5000) } },
    });
  } catch (e) { next(e); }
});

// Real-time progress stream
router.get('/:id/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  send('open', { id: req.params.id });

  const unsubscribe = subscribe(req.params.id, (stage, detail) => send('stage', { stage, detail }));
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);

  req.on('close', () => { clearInterval(heartbeat); unsubscribe(); res.end(); });
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const doc = await Verification.findById(req.params.id).lean();
    if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Verification not found.');
    const owner = doc.userId && req.user && String(doc.userId) === req.user.id;
    const privileged = req.user && ['moderator', 'admin', 'superadmin'].includes(req.user.role);
    if (doc.userId && !owner && !privileged && !doc.isPublic) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this verification.');
    }
    res.json({ success: true, data: serialize(doc) });
  } catch (e) { next(e); }
});

function serialize(doc: any) {
  return {
    id: String(doc._id),
    publicId: doc.publicId,
    isPublic: doc.isPublic,
    inputType: doc.inputType,
    originalInput: doc.originalInput,
    extractedText: doc.extractedText,
    ocrConfidence: doc.ocrConfidence,
    language: doc.language,
    status: doc.status,
    confidence: doc.confidence,
    summary: doc.summary,
    recommendation: doc.recommendation,
    claims: doc.claims ?? [],
    contradictions: doc.contradictions ?? [],
    limitations: doc.limitations ?? [],
    evidence: doc.evidence ?? [],
    timeline: doc.timeline ?? [],
    sourceStats: doc.sourceStats,
    recycled: doc.recycled,
    methodology: doc.methodology ?? [],
    aiMeta: doc.aiMeta,
    processingTimeMs: doc.processingTimeMs,
    createdAt: doc.createdAt,
  };
}

export default router;