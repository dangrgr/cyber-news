// Dedup is deterministic per PRD §8.2:
//   1) URL uniqueness on insert (handled at the DB level via UNIQUE(url) and
//      PRIMARY KEY on sha256(canonical_url)).
//   2) Title fuzzy match: ratio > 85 within a 7-day window of `published_at`
//      means the new article is the same story as an existing one.
//
// This module owns step 2; step 1 is exposed only as `articleId` on candidates.

import { titleRatio } from "../util/similarity.ts";

export const TITLE_RATIO_THRESHOLD = 85;
export const DEDUP_WINDOW_DAYS = 7;

export interface DedupCandidate {
  id: string;
  canonicalUrl: string;
  title: string;
  publishedAt: string; // ISO 8601
}

export interface ExistingArticle {
  id: string;
  canonicalUrl: string;
  title: string;
  publishedAt: string; // ISO 8601
  incidentId: string | null;
}

export interface DedupResult {
  isDuplicate: boolean;
  matchedArticleId: string | null;
  matchedIncidentId: string | null;
  matchScore: number | null;
  reason: "url_match" | "title_match" | "no_match";
}

function withinWindow(a: string, b: string, days: number): boolean {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  const diffMs = Math.abs(ta - tb);
  return diffMs <= days * 24 * 60 * 60 * 1000;
}

/**
 * Decide whether `candidate` duplicates anything in `existing`.
 *
 * Pure function — no I/O. The caller is responsible for narrowing `existing`
 * to a sensible window (e.g., last 30 days) before passing it in.
 */
export function findDuplicate(
  candidate: DedupCandidate,
  existing: readonly ExistingArticle[],
): DedupResult {
  for (const e of existing) {
    if (e.canonicalUrl === candidate.canonicalUrl || e.id === candidate.id) {
      return {
        isDuplicate: true,
        matchedArticleId: e.id,
        matchedIncidentId: e.incidentId,
        matchScore: 100,
        reason: "url_match",
      };
    }
  }

  let best: { article: ExistingArticle; score: number } | null = null;
  for (const e of existing) {
    if (!withinWindow(candidate.publishedAt, e.publishedAt, DEDUP_WINDOW_DAYS)) continue;
    const score = titleRatio(candidate.title, e.title);
    if (score > TITLE_RATIO_THRESHOLD && (best === null || score > best.score)) {
      best = { article: e, score };
    }
  }

  if (best) {
    return {
      isDuplicate: true,
      matchedArticleId: best.article.id,
      matchedIncidentId: best.article.incidentId,
      matchScore: best.score,
      reason: "title_match",
    };
  }

  return {
    isDuplicate: false,
    matchedArticleId: null,
    matchedIncidentId: null,
    matchScore: null,
    reason: "no_match",
  };
}
