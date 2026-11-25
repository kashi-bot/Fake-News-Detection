import { NewsSource } from '../models/NewsSource';

export type SourceCategory =
  | 'OFFICIAL_GOVERNMENT'
  | 'OFFICIAL_ORGANIZATION'
  | 'ESTABLISHED_PUBLISHER'
  | 'SPECIALIZED_PUBLICATION'
  | 'UNKNOWN_PUBLISHER';

const CATEGORY_LABEL: Record<SourceCategory, string> = {
  OFFICIAL_GOVERNMENT: 'Verified · Government',
  OFFICIAL_ORGANIZATION: 'Verified · Official Organization',
  ESTABLISHED_PUBLISHER: 'Verified · Trusted Publisher',
  SPECIALIZED_PUBLICATION: 'Verified · Specialized Publisher',
  UNKNOWN_PUBLISHER: 'Unverified Publisher',
};

// Built-in publisher registry (fallback if not in MongoDB)
const KNOWN_PUBLISHERS: Record<string, { category: SourceCategory; country?: string; isOfficial?: boolean }> = {
  // Established international
  'bbc.com': { category: 'ESTABLISHED_PUBLISHER', country: 'GB' },
  'bbc.co.uk': { category: 'ESTABLISHED_PUBLISHER', country: 'GB' },
  'reuters.com': { category: 'ESTABLISHED_PUBLISHER', country: 'US' },
  'apnews.com': { category: 'ESTABLISHED_PUBLISHER', country: 'US' },
  'nytimes.com': { category: 'ESTABLISHED_PUBLISHER', country: 'US' },
  'theguardian.com': { category: 'ESTABLISHED_PUBLISHER', country: 'GB' },
  'washingtonpost.com': { category: 'ESTABLISHED_PUBLISHER', country: 'US' },
  'aljazeera.com': { category: 'ESTABLISHED_PUBLISHER', country: 'QA' },
  'timesofisrael.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IL' },
  'theaustralian.com.au': { category: 'ESTABLISHED_PUBLISHER', country: 'AU' },
  'nbcnews.com': { category: 'ESTABLISHED_PUBLISHER', country: 'US' },
  'abc.net.au': { category: 'ESTABLISHED_PUBLISHER', country: 'AU' },
  'cbc.ca': { category: 'ESTABLISHED_PUBLISHER', country: 'CA' },
  'france24.com': { category: 'ESTABLISHED_PUBLISHER', country: 'FR' },
  'dw.com': { category: 'ESTABLISHED_PUBLISHER', country: 'DE' },
  'scmp.com': { category: 'ESTABLISHED_PUBLISHER', country: 'HK' },
  'cnn.com': { category: 'ESTABLISHED_PUBLISHER', country: 'US' },
  'cnbc.com': { category: 'ESTABLISHED_PUBLISHER', country: 'US' },
  'bloomberg.com': { category: 'ESTABLISHED_PUBLISHER', country: 'US' },
  'ft.com': { category: 'ESTABLISHED_PUBLISHER', country: 'GB' },
  'economist.com': { category: 'ESTABLISHED_PUBLISHER', country: 'GB' },

  // Indian established
  'thehindu.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'timesofindia.indiatimes.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'indianexpress.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'hindustantimes.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'ndtv.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'economictimes.indiatimes.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'livemint.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'business-standard.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'theprint.in': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'thewire.in': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'scroll.in': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'firstpost.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'news18.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'zeenews.india.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'aajtak.in': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'indiatoday.in': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'deccanherald.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'telegraphindia.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'tribuneindia.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'thehindubusinessline.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'aninews.in': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'ptinews.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'wionews.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },
  'republicworld.com': { category: 'ESTABLISHED_PUBLISHER', country: 'IN' },

  // Official government
  'pib.gov.in': { category: 'OFFICIAL_GOVERNMENT', country: 'IN', isOfficial: true },
  'mea.gov.in': { category: 'OFFICIAL_GOVERNMENT', country: 'IN', isOfficial: true },
  'mha.gov.in': { category: 'OFFICIAL_GOVERNMENT', country: 'IN', isOfficial: true },
  'who.int': { category: 'OFFICIAL_ORGANIZATION', country: 'INT', isOfficial: true },
  'un.org': { category: 'OFFICIAL_ORGANIZATION', country: 'INT', isOfficial: true },
};

const SATIRE_DOMAINS = new Set([
  'theonion.com',
  'babylonbee.com',
  'thefauxy.com',
  'fakingnews.com',
]);

export async function classifyDomain(domain: string): Promise<{
  category: SourceCategory;
  label: string;
  isOfficial: boolean;
  name?: string;
  isSatire?: boolean;
}> {
  if (!domain) {
    return {
      category: 'UNKNOWN_PUBLISHER',
      label: CATEGORY_LABEL.UNKNOWN_PUBLISHER,
      isOfficial: false,
    };
  }

  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();

  // 1. Check MongoDB (admin override takes priority)
  try {
    const src = await NewsSource.findOne({ domain: cleanDomain, enabled: true }).lean();
    if (src) {
      return {
        category: src.category as SourceCategory,
        label: CATEGORY_LABEL[src.category as SourceCategory] ?? CATEGORY_LABEL.UNKNOWN_PUBLISHER,
        isOfficial: Boolean(src.isOfficial),
        name: src.name,
      };
    }
  } catch {
    // DB error, continue to fallback
  }

  // 2. Check built-in known publishers
  const known = KNOWN_PUBLISHERS[cleanDomain];
  if (known) {
    return {
      category: known.category,
      label: CATEGORY_LABEL[known.category],
      isOfficial: Boolean(known.isOfficial),
      isSatire: SATIRE_DOMAINS.has(cleanDomain),
    };
  }

  // 3. Pattern-based fallback
  if (/\.(gov|gov\.[a-z]{2}|mil|govt|nic\.in)\b/.test(cleanDomain)) {
    return {
      category: 'OFFICIAL_GOVERNMENT',
      label: CATEGORY_LABEL.OFFICIAL_GOVERNMENT,
      isOfficial: true,
    };
  }
  if (/\.(edu|ac\.[a-z]{2})\b/.test(cleanDomain)) {
    return {
      category: 'OFFICIAL_ORGANIZATION',
      label: CATEGORY_LABEL.OFFICIAL_ORGANIZATION,
      isOfficial: true,
    };
  }
  if (/\.(org|int)\b/.test(cleanDomain)) {
    return {
      category: 'OFFICIAL_ORGANIZATION',
      label: CATEGORY_LABEL.OFFICIAL_ORGANIZATION,
      isOfficial: false,
    };
  }

  return {
    category: 'UNKNOWN_PUBLISHER',
    label: CATEGORY_LABEL.UNKNOWN_PUBLISHER,
    isOfficial: false,
  };
}