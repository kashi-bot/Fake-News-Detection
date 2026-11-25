const SENSATIONAL = /\b(shocking|bombshell|you won'?t believe|exposed|destroyed|slams|outrage|miracle|secret|they don'?t want you to know|breaking!!)\b/i;
const ABSOLUTE = /\b(all|every|never|always|completely|totally|100%|no one|everyone)\b/i;

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

/**
 * Lightweight, dependency-free claim extraction.
 * Picks sentences that contain verifiable assertions (entities, numbers, dates, actions).
 */
export function extractClaims(text: string, max = 8): string[] {
  const sentences = splitSentences(text);
  const scored = sentences.map(s => {
    let score = 0;
    if (/\b\d{4}\b/.test(s)) score += 2;                       // years
    if (/\b\d+([.,]\d+)?%?\b/.test(s)) score += 2;              // numbers
    if (/\b(announced|approved|passed|banned|launched|signed|reported|confirmed|denied|said|will|has|have)\b/i.test(s)) score += 2;
    if (/\b(government|ministry|parliament|court|police|company|university|WHO|UN|FDA|RBI)\b/i.test(s)) score += 2;
    if (/\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(s)) score += 1;      // proper nouns
    if (SENSATIONAL.test(s)) score += 1;
    score += Math.min(s.length / 120, 1);
    return { s, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, max).map(x => x.s);
}

export function headlineOf(text: string): string {
  const first = text.split(/\n/).map(l => l.trim()).filter(Boolean)[0] ?? text;
  return first.slice(0, 240);
}

export interface ContentSignals {
  sensationalism: number;
  absolutism: number;
  allCapsRatio: number;
  exclamations: number;
  hasAttribution: boolean;
  hasDate: boolean;
  hasNumbers: boolean;
}

export function analyzeStyle(text: string): ContentSignals {
  const letters = text.replace(/[^A-Za-z]/g, '');
  const upper = text.replace(/[^A-Z]/g, '');
  return {
    sensationalism: (text.match(SENSATIONAL) ? 1 : 0),
    absolutism: (text.match(ABSOLUTE) ?? []).length,
    allCapsRatio: letters.length ? upper.length / letters.length : 0,
    exclamations: (text.match(/!/g) ?? []).length,
    hasAttribution: /\b(according to|said|told|reported|per|sources?)\b/i.test(text),
    hasDate: /\b(\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},\s*\d{4}|\d{4}-\d{2}-\d{2})\b/.test(text),
    hasNumbers: /\b\d+([.,]\d+)?%?\b/.test(text),
  };
}

/**
 * Extract the best search query from a headline.
 * Prioritizes proper nouns (capitalized words), numbers, and rare words.
 * Drops all common English stop words.
 */
export function buildSearchQuery(headline: string): string {
  const stopWords = new Set([
    'a','an','the','and','or','but','if','of','at','by','for','with','about','against',
    'between','into','through','during','before','after','above','below','to','from','up',
    'down','in','out','on','off','over','under','again','further','then','once','here',
    'there','when','where','why','how','all','any','both','each','few','more','most','other',
    'some','such','no','nor','not','only','own','same','so','than','too','very','can','will',
    'just','should','now','is','are','was','were','be','been','being','have','has','had',
    'having','do','does','did','doing','would','could','should','may','might','must','shall',
    'i','you','he','she','it','we','they','them','their','my','your','his','her','its','our',
    'what','which','who','whom','this','that','these','those','am','said','says','told',
  ]);

  // Extract proper nouns first (capitalized words, likely entities/locations/people)
  const properNouns = headline.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) ?? [];

  // Extract numbers/years
  const numbers = headline.match(/\b\d{4}\b|\b\d+\b/g) ?? [];

  // Extract other significant words (not stop words, length > 3)
  const otherWords = headline
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  // Combine: proper nouns first (highest priority), then numbers, then other words
  const query = [
    ...properNouns.slice(0, 3),
    ...numbers.slice(0, 1),
    ...otherWords.slice(0, 3),
  ].join(' ').trim();

  return query || headline.slice(0, 80);
}