import * as cheerio from "cheerio";
import { assertPublicUrl } from "../utils/ssrfGuard";
import { ApiError } from "../utils/ApiError";

export interface ExtractedPage {
  url: string;
  canonicalUrl?: string;
  headline: string;
  text: string;
  author?: string;
  publisher?: string;
  publishedAt?: Date;
  siteName?: string;
  language?: string;
}

const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 12000;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
];

export async function extractFromUrl(rawUrl: string): Promise<ExtractedPage> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ApiError(400, "INVALID_URL", "That is not a valid URL.");
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new ApiError(
      400,
      "INVALID_URL",
      "Only http and https URLs are supported.",
    );
  }

  // SSRF guard: resolves DNS and blocks private / loopback / link-local ranges.
  await assertPublicUrl(url.href);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  let res: Response;
  try {
    res = await fetch(url.href, {
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === "AbortError") {
      throw new ApiError(
        504,
        "FETCH_TIMEOUT",
        "The page took too long to respond. Try the Headline tab instead.",
      );
    }
    throw new ApiError(
      502,
      "FETCH_FAILED",
      "Could not reach that page. Try the Headline or Article text tab instead.",
    );
  } finally {
    clearTimeout(timer);
  }

  // Handle specific HTTP statuses with helpful messages
  if (res.status === 401 || res.status === 403) {
    throw new ApiError(
      451,
      "ACCESS_RESTRICTED",
      'This publisher blocks automated readers (Cloudflare or bot protection). Please use the "Headline" or "Article text" tab instead — those still work for verification.',
    );
  }
  if (res.status === 402) {
    throw new ApiError(
      451,
      "PAYWALLED",
      'That article is behind a paywall. Please copy the headline or the article text into the "Headline" / "Article text" tab instead.',
    );
  }
  if (res.status === 429) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      'The publisher is rate-limiting us right now. Please wait a minute and try again, or use the "Headline" tab.',
    );
  }
  if (!res.ok) {
    throw new ApiError(
      502,
      "FETCH_FAILED",
      `The publisher returned status ${res.status}. Please use the "Headline" or "Article text" tab instead.`,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml")
  ) {
    throw new ApiError(
      415,
      "UNSUPPORTED_CONTENT",
      "That URL does not return an HTML article.",
    );
  }

  // Read body with size limit
  const reader = res.body?.getReader();
  if (!reader) throw new ApiError(502, "FETCH_FAILED", "Empty response body.");

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString(
    "utf8",
  );

  return parseArticle(html, url.href);
}

export function parseArticle(html: string, url: string): ExtractedPage {
  const $ = cheerio.load(html);
  $(
    'script, style, noscript, nav, header, footer, aside, form, iframe, .ad, .ads, .advert, [role="navigation"], [aria-hidden="true"]',
  ).remove();

  const meta = (sel: string, attr = "content") => $(sel).attr(attr)?.trim();

  const headline =
    meta('meta[property="og:title"]') ||
    meta('meta[name="twitter:title"]') ||
    $("h1").first().text().trim() ||
    $("title").text().trim();

  const canonicalUrl = $('link[rel="canonical"]').attr("href");
  const publisher =
    meta('meta[property="og:site_name"]') ||
    (canonicalUrl ? safeHost(canonicalUrl) : safeHost(url));
  const author =
    meta('meta[name="author"]') ||
    meta('meta[property="article:author"]') ||
    $('[rel="author"]').first().text().trim() ||
    undefined;

  const publishedRaw =
    meta('meta[property="article:published_time"]') ||
    meta('meta[name="pubdate"]') ||
    meta('meta[name="publish-date"]') ||
    meta('meta[itemprop="datePublished"]') ||
    $("time[datetime]").first().attr("datetime") ||
    $("time").first().attr("datetime");

  const publishedAt =
    publishedRaw && !Number.isNaN(Date.parse(publishedRaw))
      ? new Date(publishedRaw)
      : undefined;

  const language =
    $("html").attr("lang")?.slice(0, 5) ||
    meta('meta[property="og:locale"]')?.slice(0, 2);

  // Prefer article/main/body for text extraction
  const container = $("article").length
    ? $("article")
    : $("main").length
      ? $("main")
      : $('[role="main"]').length
        ? $('[role="main"]')
        : $("body");

  const paragraphs: string[] = [];
  container.find("p").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 40) paragraphs.push(t);
  });

  const text = paragraphs.join("\n\n").slice(0, 20000);

  if (!text || text.length < 120) {
    throw new ApiError(
      422,
      "EXTRACTION_FAILED",
      'We could not extract readable article text from that page. It may be JavaScript-rendered, paywalled, or not an article. Try the "Article text" tab and paste the content directly.',
    );
  }

  return {
    url,
    canonicalUrl,
    headline,
    text,
    author,
    publisher,
    publishedAt,
    siteName: publisher,
    language,
  };
}

function safeHost(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
