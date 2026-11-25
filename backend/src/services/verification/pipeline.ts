import crypto from "node:crypto";
import { Verification, VerificationDoc } from "../../models/Verification";
import { newsRegistry } from "../../providers/news/registry";
import { getAiProvider } from "../../providers/ai/registry";
import { EvidenceItem } from "../../providers/ai/types";
import { extractClaims, headlineOf, analyzeStyle } from "./claims";
import {
  dedupe,
  rank,
  buildTimeline,
  groupAgreement,
  NormalizedArticle,
} from "./compare";
import { detectRecycled } from "./recycle";
import { HeuristicProvider } from "../../providers/ai/HeuristicProvider";
import { validateAiOutput } from "./validateAi";
import { decideStatus, STATUS_COPY } from "./decide";
import { classifyDomain } from "../sourceCredibility";
import { logger } from "../../utils/logger";

export type Stage =
  | "reading_content"
  | "extracting_claims"
  | "searching_sources"
  | "comparing_sources"
  | "checking_dates"
  | "source_credibility"
  | "ai_reasoning"
  | "generating_report"
  | "done";

export const STAGE_LABEL: Record<Stage, string> = {
  reading_content: "Reading content",
  extracting_claims: "Extracting claims",
  searching_sources: "Searching news sources",
  comparing_sources: "Comparing sources",
  checking_dates: "Checking publication dates",
  source_credibility: "Analyzing source credibility",
  ai_reasoning: "Running AI reasoning",
  generating_report: "Generating final report",
  done: "Complete",
};

export interface PipelineInput {
  inputType: "headline" | "text" | "url" | "image" | "search";
  text: string;
  originalInput: string;
  language?: string;
  ocrConfidence?: number;
  metadata?: Record<string, unknown>;
}

export interface PipelineHooks {
  onStage?: (stage: Stage, detail?: string) => void;
}

export async function runVerification(
  input: PipelineInput,
  userId: string | undefined,
  hooks: PipelineHooks = {},
): Promise<VerificationDoc> {
  const started = Date.now();
  const emit = (s: Stage, detail?: string) => {
    hooks.onStage?.(s, detail);
    logger.debug({ stage: s, detail }, "verification stage");
  };

  const doc: any = await Verification.create({
    userId,
    publicId: crypto.randomBytes(9).toString("base64url"),
    inputType: input.inputType,
    originalInput: input.originalInput.slice(0, 5000),
    extractedText: input.text.slice(0, 20000),
    ocrConfidence: input.ocrConfidence,
    language: input.language ?? "en",
    metadata: input.metadata ?? {},
    stage: "reading_content",
  });

  const fail = async (code: string, message: string) => {
    doc.status = "FAILED";
    doc.error = { code, message };
    doc.summary = `⚠️ Backend Error: ${message}`;
    doc.stage = "done";
    doc.processingTimeMs = Date.now() - started;
    await doc.save();
    return doc;
  };

  try {
    emit("reading_content");
    const content = input.text.trim();
    if (content.length < 15)
      return await fail("CONTENT_TOO_SHORT", "Not enough text to verify.");

    emit("extracting_claims");
    const headline = headlineOf(content);
    const claims = extractClaims(content);
    const style = analyzeStyle(content);
    doc.claims = claims.map((c) => ({
      text: c,
      status: "UNVERIFIED" as const,
    }));
    doc.stage = "extracting_claims";
    await doc.save();

    emit("searching_sources");
    const queries = buildQueries(headline, claims);
    const collected: { articles: any[]; provider: string }[] = [];
    for (const q of queries.slice(0, 3)) {
      // FIX: Removed 'language' from search so Google always fetches English facts
      const r = await newsRegistry.search({ 
        query: q, 
        max: 20 
      });
      collected.push({ articles: r.articles, provider: r.provider });
      if (collected.flatMap((c) => c.articles).length >= 12) break;
    }
    const flat = collected.flatMap((c) =>
      c.articles.map((a) => ({ ...a, __provider: c.provider })),
    );
    const providerName = collected[0]?.provider ?? "none";
    emit("searching_sources", `${flat.length} raw results from ${providerName}`);

    emit("comparing_sources");
    const unique = dedupe(flat);

    // Drop articles older than 90 days for current-events verification
    const cutoff = Date.now() - 90 * 86400000;
    const recent = unique.filter((a) => {
      if (!a.publishedAt) return true;
      return new Date(a.publishedAt).getTime() > cutoff;
    });

    // Rank and filter by relevance threshold
    let ranked = rank(recent, `${headline} ${claims.join(" ")}`, providerName)
      .filter((a) => a.relevance >= 0.15)
      .slice(0, 12);

    if (ranked.length === 0 && recent.length > 0) {
      ranked = rank(recent, headline, providerName).slice(0, 5);
    }
    if (ranked.length === 0 && unique.length > 0) {
      ranked = rank(unique, headline, providerName).slice(0, 5);
    }

    const officialDomains = new Set<string>();
    const classified: NormalizedArticle[] = [];
    for (const a of ranked) {
      const c = await classifyDomain(a.domain);
      if (c.isOfficial) officialDomains.add(a.domain);
      (a as any).sourceCategory = c.label;
      classified.push(a);
    }

    emit("checking_dates");
    const recycled = detectRecycled(content, classified);
    const timeline = buildTimeline(classified, officialDomains);
    const agreement = groupAgreement(classified);

    emit("source_credibility");
    const officialCount = classified.filter((a) =>
      (a as any).sourceCategory?.startsWith("Official"),
    ).length;
    const establishedCount = classified.filter(
      (a) => (a as any).sourceCategory === "Established Publisher",
    ).length;

    const evidence: EvidenceItem[] = classified.map((a, i) => ({
      index: i,
      title: a.title,
      url: a.url,
      sourceName: a.sourceName ?? a.domain,
      sourceCategory: (a as any).sourceCategory ?? "Unknown / Unverified Publisher",
      publishedAt: a.publishedAtDate?.toISOString(),
    }));

    emit("ai_reasoning");
    const ai = getAiProvider();
    logger.info({ provider: ai.name, model: ai.model }, "Using AI provider");

    let aiOut: any;

    try {
      // FIX: We still pass language to the AI so it translates the response
      aiOut = await ai.analyze({
        content,
        claims,
        evidence,
        officialEvidence: evidence.filter((e) => e.sourceCategory.startsWith("Official")),
        earliestPublication: recycled.originalPublishedAt?.toISOString(),
        language: doc.language ?? "en",
      });
    } catch (err: any) {
      logger.error({ err: err?.message }, "AI provider failed, falling back to heuristic");
      aiOut = await new HeuristicProvider().analyze({
        content,
        claims,
        evidence,
        officialEvidence: evidence.filter((e) => e.sourceCategory.startsWith("Official")),
        earliestPublication: recycled.originalPublishedAt?.toISOString(),
        language: doc.language ?? "en",
      });
    }

    const validated = validateAiOutput(aiOut as any, evidence);
    emit("generating_report");
    const decided = decideStatus(validated, evidence.length, officialCount);

    doc.claims = validated.claims.map((c) => ({
      text: c.text,
      status: c.status,
      confidence: c.confidence,
      supportingRefs: c.supportingRefs,
      contradictingRefs: c.contradictingRefs,
      note: c.note,
    }));

    doc.status = decided.status;
    doc.confidence = decided.confidence;
    doc.summary = validated.summary || STATUS_COPY[decided.status];
    doc.recommendation = validated.recommendation;
    doc.limitations = dedupeStrings([
      ...validated.limitations,
      ...decided.adjustments,
    ]);
    doc.contradictions = validated.contradictions;

    // FIX: Sort Evidence by Newest First
    const sortedEvidence = [...classified].sort((a, b) => 
      new Date(b.publishedAtDate || 0).getTime() - new Date(a.publishedAtDate || 0).getTime()
    );

    doc.evidence = sortedEvidence.map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      sourceName: a.sourceName,
      sourceDomain: a.domain,
      sourceCategory: (a as any).sourceCategory,
      publishedAt: a.publishedAtDate,
      author: a.author,
      imageUrl: a.imageUrl,
      relevance: a.relevance,
      provider: (a as any).__provider,
    }));

    doc.timeline = timeline.map((t) => ({
      at: t.at,
      label: t.label,
      url: t.url,
      kind: t.kind,
    }));
    doc.sourceStats = {
      total: evidence.length,
      official: officialCount,
      established: establishedCount,
      unknown: evidence.length - officialCount - establishedCount,
    };
    doc.recycled = {
      isRecycled: recycled.isRecycled,
      originalPublishedAt: recycled.originalPublishedAt,
      note: recycled.note,
    };
    doc.methodology = [
      `Extracted ${claims.length} candidate claim(s) from the submitted content.`,
      `Queried configured news providers with ${Math.min(queries.length, 3)} derived search quer${queries.length === 1 ? "y" : "ies"}.`,
      `De-duplicated and relevance-ranked ${unique.length} article(s) down to ${classified.length}.`,
      `Grouped coverage into ${agreement.clusters} story cluster(s); largest cluster had ${agreement.largest} article(s).`,
      `Classified each source domain against the managed newsSources registry and official-domain rules.`,
      `Style signals — sensationalism: ${style.sensationalism}, absolutism: ${style.absolutism}, attribution present: ${style.hasAttribution}.`,
      `Final verdict produced by deterministic rules over retrieved evidence; the AI layer proposes wording only.`,
    ];
    doc.aiMeta = { provider: ai.name, model: ai.model };
    doc.processingTimeMs = Date.now() - started;
    doc.stage = "done";
    await doc.save();

    emit("done");
    return doc;
  } catch (err: any) {
    logger.error(
      { err: err?.message, stack: err?.stack },
      "verification pipeline failed",
    );
    return await fail(
      "VERIFICATION_FAILED",
      err?.message ?? "Unable to complete verification.",
    );
  }
}

function buildQueries(headline: string, claims: string[]): string[] {
  const queries: string[] = [];

  const STOP_WORDS = new Set([
    'during', 'with', 'in', 'and', 'the', 'a', 'an', 'for', 'down',
    'forces', 'against', 'from', 'is', 'on', 'at', 'after', 'was',
    'were', 'are', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'can', 'to', 'of', 'by', 'as', 'that', 'this',
    'these', 'those', 'it', 'its', 'not', 'no', 'yes', 'all', 'any',
    'some', 'every', 'each', 'other', 'such', 'than', 'then', 'so',
    'but', 'or', 'if', 'because', 'while', 'when', 'where', 'who',
    'what', 'which', 'how', 'why', 'let', 'lets', 'got', 'get',
    'going', 'going', 'said', 'says', 'told', 'tell', 'says',
  ]);

  const cleanTerm = (text: string, maxWords: number) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
      .slice(0, maxWords)
      .join(' ')
      .trim();
  };

  if (headline) {
    const cleaned = cleanTerm(headline, 8);
    if (cleaned.split(' ').length >= 3) queries.push(cleaned);
  }

  const properNouns = headline
    .match(/\b[A-Z][a-z]{2,}\b/g)
    ?.filter(w => !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 4)
    .join(' ');
  if (properNouns && properNouns.split(' ').length >= 2 && !queries.includes(properNouns)) {
    queries.push(properNouns);
  }

  for (const claim of claims.slice(0, 2)) {
    const cleaned = cleanTerm(claim, 6);
    if (cleaned.split(' ').length >= 4 && !queries.includes(cleaned)) {
      queries.push(cleaned);
    }
  }

  if (queries.length === 0) queries.push(headline.slice(0, 50));
  return queries;
}

function dedupeStrings(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}