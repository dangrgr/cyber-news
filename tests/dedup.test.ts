import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { canonicalizeUrl, articleId } from "../src/ingest/canonicalize.ts";
import {
  findDuplicate,
  TITLE_RATIO_THRESHOLD,
  type ExistingArticle,
} from "../src/ingest/dedup.ts";
import { titleRatio } from "../src/util/similarity.ts";
import {
  A_KREBS_SHINY,
  A_BLEEPING_SHINY_NEAR_DUP,
  A_DARKREADING_DIFFERENT_STORY,
  A_TITLE_CHANGED_LATER,
  A_OUTSIDE_DEDUP_WINDOW,
  type ArticleFixture,
} from "./fixtures/articles.ts";

function asExisting(a: ArticleFixture, incidentId: string | null = null): ExistingArticle {
  const canonical = canonicalizeUrl(a.url);
  return {
    id: articleId(canonical),
    canonicalUrl: canonical,
    title: a.title,
    publishedAt: a.publishedAt,
    incidentId,
  };
}

function asCandidate(a: ArticleFixture) {
  const canonical = canonicalizeUrl(a.url);
  return {
    id: articleId(canonical),
    canonicalUrl: canonical,
    title: a.title,
    publishedAt: a.publishedAt,
  };
}

describe("dedup: URL match", () => {
  it("returns url_match when canonical URLs are identical", () => {
    const existing = [asExisting(A_KREBS_SHINY, "incident-1")];
    const cand = asCandidate(A_KREBS_SHINY);
    const r = findDuplicate(cand, existing);

    assert.equal(r.isDuplicate, true);
    assert.equal(r.reason, "url_match");
    assert.equal(r.matchedIncidentId, "incident-1");
    assert.equal(r.matchScore, 100);
  });

  it("treats utm-only differences as the same canonical URL", () => {
    const existing = [asExisting(A_KREBS_SHINY)];
    const dirtyCand = asCandidate({
      ...A_KREBS_SHINY,
      url: A_KREBS_SHINY.url + "?utm_source=newsletter",
    });
    const r = findDuplicate(dirtyCand, existing);
    assert.equal(r.isDuplicate, true, "utm-stripped URLs must match");
    assert.equal(r.reason, "url_match");
  });
});

describe("dedup: title fuzzy match", () => {
  it("flags near-duplicate titles within the 7-day window", () => {
    const existing = [asExisting(A_KREBS_SHINY, "incident-shiny-cisco")];
    const cand = asCandidate(A_BLEEPING_SHINY_NEAR_DUP);
    const r = findDuplicate(cand, existing);

    assert.equal(r.isDuplicate, true);
    assert.equal(r.reason, "title_match");
    assert.equal(r.matchedIncidentId, "incident-shiny-cisco");
    assert.ok(
      r.matchScore !== null && r.matchScore > TITLE_RATIO_THRESHOLD,
      `score ${r.matchScore} should exceed ${TITLE_RATIO_THRESHOLD}`,
    );
  });

  it("does not flag a different story even with shared entities", () => {
    const existing = [asExisting(A_KREBS_SHINY)];
    const cand = asCandidate(A_DARKREADING_DIFFERENT_STORY);
    const r = findDuplicate(cand, existing);
    assert.equal(r.isDuplicate, false);
    assert.equal(r.reason, "no_match");
  });

  it("flags a small headline reword later the same day as the same story", () => {
    const existing = [asExisting(A_KREBS_SHINY, "incident-shiny-cisco")];
    const cand = asCandidate(A_TITLE_CHANGED_LATER);
    const r = findDuplicate(cand, existing);
    assert.equal(r.isDuplicate, true);
    assert.equal(r.matchedIncidentId, "incident-shiny-cisco");
  });

  it("ignores title matches outside the 7-day window", () => {
    // Existing article published Feb 1 with the same title; candidate published April 15.
    const existing = [asExisting(A_OUTSIDE_DEDUP_WINDOW)];
    const cand = asCandidate(A_BLEEPING_SHINY_NEAR_DUP);
    const r = findDuplicate(cand, existing);
    assert.equal(
      r.isDuplicate,
      false,
      "titles that match across >7d should not collapse — different story months apart",
    );
  });

  it("URL match wins even when published_at is far apart", () => {
    // Same canonical URL but very old published_at — URL identity beats the date window.
    const existing = [asExisting({ ...A_KREBS_SHINY, publishedAt: "2025-01-01T00:00:00Z" })];
    const cand = asCandidate(A_KREBS_SHINY);
    const r = findDuplicate(cand, existing);
    assert.equal(r.isDuplicate, true);
    assert.equal(r.reason, "url_match");
  });
});

describe("titleRatio: rapidfuzz parity sanity checks", () => {
  it("returns 100 for identical strings", () => {
    assert.equal(titleRatio("ShinyHunters claim Cisco breach", "ShinyHunters claim Cisco breach"), 100);
  });

  it("normalizes punctuation and case", () => {
    const r = titleRatio("ShinyHunters claim Cisco breach", "shinyhunters CLAIM cisco breach!!!");
    assert.equal(r, 100);
  });

  it("returns >85 for headline rewording with same content", () => {
    const r = titleRatio(
      "ShinyHunters Claim Massive Cisco Salesforce Data Leak",
      "ShinyHunters claim Cisco Salesforce data leak",
    );
    assert.ok(r > TITLE_RATIO_THRESHOLD, `expected >${TITLE_RATIO_THRESHOLD}, got ${r}`);
  });

  it("returns ≤85 for genuinely different headlines", () => {
    const r = titleRatio(
      "ShinyHunters Claim Cisco Salesforce Data Leak",
      "Volt Typhoon Pre-Positioning Continues in US Utility Sector",
    );
    assert.ok(r <= TITLE_RATIO_THRESHOLD, `expected ≤${TITLE_RATIO_THRESHOLD}, got ${r}`);
  });
});
