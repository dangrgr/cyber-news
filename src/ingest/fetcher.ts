// RSS + article-body fetch. PRD §8.1: rss-parser → @mozilla/readability on jsdom.

import Parser from "rss-parser";
import { JSDOM } from "jsdom";
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

const rssParser = new Parser({
  timeout: FETCH_TIMEOUT_MS,
  headers: { "User-Agent": USER_AGENT },
});

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

export async function extractArticleBody(url: string): Promise<string | null> {
  // Best-effort: a non-2xx, malformed HTML, or paywalled page returns null and
  // the caller falls back to the RSS content snippet.
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    if (!article || !article.textContent) return null;
    return article.textContent.replace(/\s+\n/g, "\n").trim();
  } catch {
    return null;
  }
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
