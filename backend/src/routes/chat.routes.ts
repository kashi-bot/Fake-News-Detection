import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { env } from '../config/env';
import { Verification } from '../models/Verification';

const router = Router();

router.post('/', requireAuth, validate(z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  context: z.string().optional(),
})), async (req, res, next) => {
  try {
    const { messages, context } = req.body;

    // Try to load verification context if user is on a result page
    let newsContext = '';
    if (context) {
      try {
        const v: any = await Verification.findById(context).lean();
        if (v) {
          newsContext = `VERIFICATION CONTEXT (you are discussing THIS specific verification):
- Claim: ${v.originalInput}
- Verdict: ${v.status}
- Confidence: ${Math.round((v.confidence ?? 0) * 100)}%
- Summary: ${v.summary}
- Evidence sources: ${v.evidence?.map((e: any) => `${e.sourceName || e.sourceDomain} — "${e.title}"`).join('; ') || 'none retrieved'}`;
        }
      } catch {
        // Invalid context id, ignore
      }
    }

    const hasContext = newsContext.length > 0;

    // THE CRITICAL FIX: make the AI honest about what it doesn't know
    const systemPrompt = `You are TruthLens AI, a fact-checking assistant.

${hasContext
  ? `You have access to this verified fact-check. Use ONLY the evidence below to answer.\n\n${newsContext}\n\nIf the user asks about a DIFFERENT claim, tell them: "I can only discuss the current verification. To check a new claim, please use the Verify News page."`
  : `You do NOT have any verification context right now.

CRITICAL RULES:
1. You CANNOT search the web. You do NOT know if a claim is true or false.
2. If the user asks about a news claim, DO NOT give a verdict. Instead, reply exactly:
   "Please paste this headline into the **Verify News** page so I can check it against live sources first. Once verified, come back and I'll explain the evidence."
3. NEVER guess or speculate about whether a claim is true or false.
4. If you are unsure, say so plainly.`}

FORMAT RULES:
- Use markdown formatting: **bold** for key terms, bullet lists for evidence, and short paragraphs.
- Keep responses concise. No walls of text.
- Never fabricate URLs, quotes, or sources.`;

    if (env.AI_PROVIDER === 'groq' && env.GROQ_API_KEY) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: env.AI_MODEL,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error('Chat Groq error:', response.status, body);
        return res.status(502).json({ success: false, error: { code: 'AI_ERROR', message: 'AI service unavailable.' } });
      }

      const json: any = await response.json();
      return res.json({ success: true, data: { reply: json.choices[0].message.content } });
    }

    res.json({ success: true, data: { reply: 'AI is not configured.' } });
  } catch (e) { next(e); }
});

export default router;