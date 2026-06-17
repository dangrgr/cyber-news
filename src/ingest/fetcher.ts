// RSS + article-body fetch. PRD §8.1: rss-parser → @mozilla/readability on jsdom.

import Parser from "rss-parser";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";
import type { SourceFeed } from "./sources.ts";

export interface RawEntry {
  source: SourceFeed;
  title: string;
  link: string;
  guid: string | null;
  publishedAt: string; // ISO 8601
  author: string | null;
  /** Body extracted via Readability when available; falls back to RSS content. */
  rawText: string;
}

const USER_AGENT =
  "cyber-news-dissector/0.1 (+https://github.com/dangrgr/cyber-news; personal-use)";

const FETCH_TIMEOUT_MS = 20_000;

// Cap the HTML handed to JSDOM. A compromised or misbehaving source can return
// an arbitrarily large body; JSDOM parse cost scales with input size, so bound
// it defensively. 2 MB comfortably exceeds any real article's markup.
const MAX_HTML_BYTES = 2_000_000;

const rssParser = new Parser({
  timeout: FETCH_TIMEOUT_MS,
  headers: { "User-Agent": USER_AGENT },
});

type JsdomError = Error & { type?: string; detail?: unknown };

function isBenignStylesheetParseError(error: JsdomError): boolean {
  return error.type === "css parsing" && error.message === "Could not parse CSS stylesheet";
}

function createArticleVirtualConsole(): VirtualConsole {
  const virtualConsole = new VirtualConsole();

  // Preserve normal in-page console forwarding and non-CSS jsdom diagnostics,
  // but drop stylesheet parser dumps. Modern vendor CSS often exceeds jsdom's
  // CSSOM support; dumping the full stylesheet creates multi-MiB ingest logs.
  virtualConsole.sendTo(console, { omitJSDOMErrors: true });
  virtualConsole.on("jsdomError", (error) => {
    if (!isBenignStylesheetParseError(error as JsdomError)) {
      console.error(error);
    }
  });

  return virtualConsole;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: ctl.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Why full-text extraction didn't produce a body, so the per-source fallback
 *  rate is debuggable beyond a yes/no. `http_error`: non-2xx response.
 *  `empty_extraction`: fetched + parsed, but Readability yielded no text.
 *  `fetch_error`: fetch/parse threw (timeout, DNS, JSDOM crash). Surfacing the
 *  category — rather than collapsing all three to a bare `null` — is the
 *  diagnostic CLAUDE.md's "never swallow silently" discipline calls for. */
export type FallbackReason = "http_error" | "empty_extraction" | "fetch_error";

export interface ExtractionResult {
  /** Resolved plain-text body, or null when extraction fell back. */
  text: string | null;
  /** null when `text` is present; the failure category otherwise. */
  fallbackReason: FallbackReason | null;
}

/**
 * Best-effort full-text extraction that reports *why* it failed when it does.
 * A non-2xx, malformed-HTML, paywalled, or empty page yields a null `text`
 * with the reason set; the caller falls back to the RSS content snippet.
 */
export async function extractArticleBodyDetailed(url: string): Promise<ExtractionResult> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return { text: null, fallbackReason: "http_error" };
    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    const dom = new JSDOM(html, { url, virtualConsole: createArticleVirtualConsole() });
    const article = new Readability(dom.window.document).parse();
    const text = article?.textContent?.replace(/\s+\n/g, "\n").trim() ?? "";
    // Empty/whitespace-only extraction is a fallback, not a valid body — this
    // is the single source of truth for "did we get usable text", so callers
    // never have to distinguish "" from null themselves.
    if (text.length === 0) return { text: null, fallbackReason: "empty_extraction" };
    return { text, fallbackReason: null };
  } catch {
    return { text: null, fallbackReason: "fetch_error" };
  }
}

/** Back-compat wrapper: the body text alone, or null on any fallback. */
export async function extractArticleBody(url: string): Promise<string | null> {
  return (await extractArticleBodyDetailed(url)).text;
}

/** Which path produced the stored article body. Readability is the intended
 *  path; `rss_fallback` means full-text extraction failed (non-2xx, paywall,
 *  parse error, or empty result) and we kept the RSS snippet. Surfacing this
 *  makes the per-source fallback rate observable (PRD enhancement #1) — the
 *  prerequisite diagnostic before any source-specific scraper rules. */
export type ExtractionMethod = "readability" | "rss_fallback";

export interface ResolvedBody {
  text: string;
  method: ExtractionMethod;
  /** Word count of the resolved body, HTML tags stripped so a Readability
   *  plain-text body and an HTML RSS snippet are measured comparably. A low
   *  count on a `readability` body is a truncation/boilerplate signal. */
  wordCount: number;
  /** null on the readability path; the extraction failure category that drove
   *  the RSS fallback otherwise. */
  fallbackReason: FallbackReason | null;
}

/** Count words after stripping HTML tags, so plain-text and HTML bodies
 *  compare. Only real tags (`<` + letter or `/`) are stripped, so prose like
 *  `5 < 10` or `payload < 2KB` keeps its tokens; `&nbsp;`-family entities are
 *  treated as word boundaries so HTML-encoded spaces don't fuse two words. */
export function bodyWordCount(text: string): number {
  const stripped = text
    .replace(/<\/?[a-zA-Z][^>]*>/g, " ")
    .replace(/&(nbsp|#0*160|#x0*a0);/gi, " ");
  const matches = stripped.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Resolve an article body, recording which extraction path produced it (and,
 * on fallback, why). `extractor` is injectable as a test seam (matches the DI
 * style used for clocks / cveExists elsewhere); production callers use the
 * default. An empty/whitespace extraction is deliberately treated as a
 * fallback — `extractArticleBodyDetailed` already collapses it to a null
 * `text`, so an empty body is never stored as a "readability" result.
 */
export async function resolveArticleBody(
  url: string,
  rssFallback: string,
  extractor: (u: string) => Promise<ExtractionResult> = extractArticleBodyDetailed,
): Promise<ResolvedBody> {
  const extracted = await extractor(url);
  if (extracted.text !== null) {
    return {
      text: extracted.text,
      method: "readability",
      wordCount: bodyWordCount(extracted.text),
      fallbackReason: null,
    };
  }
  const text = rssFallback ?? "";
  return {
    text,
    method: "rss_fallback",
    wordCount: bodyWordCount(text),
    fallbackReason: extracted.fallbackReason,
  };
}

export async function fetchFeed(source: SourceFeed): Promise<RawEntry[]> {
  const feed = await rssParser.parseURL(source.url);
  const out: RawEntry[] = [];
  for (const item of feed.items ?? []) {
    if (!item.link || !item.title) continue;
    const publishedAt = pickDate(item);
    out.push({
      source,
      title: item.title.trim(),
      link: item.link,
      guid: item.guid ?? null,
      publishedAt,
      author: (item.creator ?? item.author ?? null) as string | null,
      rawText: (item["content:encoded"] ?? item.content ?? item.contentSnippet ?? "") as string,
    });
  }
  return out;
}

function pickDate(item: { isoDate?: string; pubDate?: string }): string {
  if (item.isoDate) return item.isoDate;
  if (item.pubDate) {
    const t = Date.parse(item.pubDate);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  // Unknown — stamp as ingest time so downstream date-window code still has a value.
  return new Date().toISOString();
}
