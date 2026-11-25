import { AiProvider, AiAnalysisInput, AiAnalysisOutput } from './types';

const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu',
  mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu'
};

export class GroqProvider implements AiProvider {
  readonly name = 'groq';
  readonly model: string;

  constructor(private apiKey: string, model?: string) {
    this.model = model || 'qwen/qwen3.8-27b';
  }

  isConfigured() { return Boolean(this.apiKey); }

  async analyze(input: AiAnalysisInput): Promise<AiAnalysisOutput> {
    const evidenceBlock = input.evidence.map(e =>
      `[${e.index}] ${e.title}\n    Source: ${e.sourceName}\n    URL: ${e.url}`
    ).join('\n');

    const targetLanguage = LANG_NAMES[input.language || 'en'] || 'English';

    const prompt = `You are TruthLens AI, an expert fact-checking assistant.

CLAIM TO CHECK:
"${input.content}"

REAL SEARCH RESULTS RETRIEVED:
${evidenceBlock || '(No articles were retrieved)'}

INSTRUCTIONS & RULES:
1. SATIRE DETECTION: If the source is a known satire site (e.g., The Onion, Babylon Bee), you MUST label it "SATIRE".
2. TRUST RULE: If 3 or more independent, reputable sources (like BBC, Reuters, NDTV, The Hindu) confirm the MAIN event, you MUST return "VERIFIED" with a confidence of 0.90 or higher.
3. CONTRADICTION: If sources directly contradict the claim, return "FALSE" or "LIKELY_FALSE".
4. INSUFFICIENT EVIDENCE: If no reliable sources are found, say "INSUFFICIENT_EVIDENCE".
5. NEVER fabricate sources or quotes.

CRITICAL LANGUAGE INSTRUCTION:
You MUST write the values for "summary", "claims", and "limitations" in **${targetLanguage}**. 

Respond ONLY with valid JSON matching this exact schema:
{
  "overallStatus": "VERIFIED" | "LIKELY_AUTHENTIC" | "UNVERIFIED" | "MISLEADING" | "LIKELY_FALSE" | "FALSE" | "SATIRE" | "INSUFFICIENT_EVIDENCE",
  "confidence": 0.0 to 1.0,
  "summary": "A conversational explanation in ${targetLanguage}.",
  "claims": [{ "text": "string", "status": "SUPPORTED" | "CONTRADICTED" | "UNVERIFIED", "confidence": 0.0, "supportingRefs": [0], "contradictingRefs": [], "note": "in ${targetLanguage}" }],
  "limitations": ["in ${targetLanguage}"]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const json: any = await res.json();
    return JSON.parse(json.choices[0].message.content) as AiAnalysisOutput;
  }
}