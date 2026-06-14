// Offline coverage for the `article_ingested` run-log event: fires once per
// persisted row (with extraction_method / word_count / fallback_reason), and
// is skipped for in-run duplicates. Uses the injectable seams on
// `processSource` so no network or global Turso client is touched.

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient, type Client } from "@libsql/client";

import { runMigrations } from "../../scripts/migrate.ts";
import { processSource } from "../../src/ingest/run.ts";
import { SOURCES, type SourceFeed } from "../../src/ingest/sources.ts";
import type { RawEntry, ResolvedBody } from "../../src/ingest/fetcher.ts";
import type { RunLogger } from "../../src/util/run_log.ts";

let db: Client;

beforeEach(async () => {
  db = createClient({ url: ":memory:" });
  await runMigrations(db, "migrations");
});

function captureRunLog(): { runLog: RunLogger; events: Array<Record<string, unknown>> } {
  const events: Array<Record<string, unknown>> = [];
  const runLog: RunLogger = {
    runId: "test-run",
    stage: "ingest",
    logCall: () => {},
    logEvent: (e) => events.push(e),
    finishRun: async () => {},
  };
  return { runLog, events };
}

function entry(source: SourceFeed, link: string, title: string): RawEntry {
  return {
    source,
    title,
    link,
    guid: null,
    publishedAt: new Date().toISOString(),
    author: null,
    rawText: "fallback snippet body",
  };
}

describe("processSource: article_ingested event", () => {
  it("emits one event per inserted row carrying method / word_count / fallback_reason", async () => {
    const source = SOURCES[0]!;
    const { runLog, events } = captureRunLog();

    // Two distinct articles: one resolved via readability, one via RSS fallback
    // with a specific failure reason — both should be persisted and logged.
    const resolveBody = async (url: string): Promise<ResolvedBody> =>
      url.endsWith("/2")
        ? { text: "rss body", method: "rss_fallback", wordCount: 2, fallbackReason: "http_error" }
        : { text: "readability body here", method: "readability", wordCount: 3, fallbackReason: null };

    await processSource(0, [], runLog, {
      client: db,
      fetchFeed: async () => [
        entry(source, "https://example.com/article/1", "First incident report"),
        entry(source, "https://example.com/article/2", "Second incident report"),
      ],
      resolveBody,
    });

    const ingested = events.filter((e) => e.event === "article_ingested");
    assert.equal(ingested.length, 2);

    const byMethod = Object.fromEntries(ingested.map((e) => [e.extraction_method, e]));
    assert.equal(byMethod.readability!.fallback_reason, null);
    assert.equal(byMethod.readability!.word_count, 3);
    assert.equal(byMethod.rss_fallback!.fallback_reason, "http_error");
    assert.equal(byMethod.rss_fallback!.word_count, 2);
    // source identity is carried for per-source aggregation.
    assert.equal(byMethod.readability!.source_id, source.id);
    assert.equal(byMethod.readability!.source_tier, source.tier);
  });

  it("does not emit article_ingested for an in-run duplicate (no row written)", async () => {
    const source = SOURCES[0]!;
    const { runLog, events } = captureRunLog();

    await processSource(0, [], runLog, {
      client: db,
      // Same canonical URL + title twice → second entry dedups against the first.
      fetchFeed: async () => [
        entry(source, "https://example.com/dup", "Repeated story"),
        entry(source, "https://example.com/dup", "Repeated story"),
      ],
      resolveBody: async () => ({
        text: "body",
        method: "readability",
        wordCount: 1,
        fallbackReason: null,
      }),
    });

    assert.equal(events.filter((e) => e.event === "article_ingested").length, 1);
    assert.equal(events.filter((e) => e.event === "dedup_decision").length, 2);
  });

  it("does not emit article_ingested when article already exists in DB (ON CONFLICT no-op)", async () => {
    // Simulates articles older than DEDUP_LOOKBACK_DAYS that reappear in RSS feeds:
    // recentArticlesForDedup won't include them, so findDuplicate passes them through,
    // but insertArticle hits ON CONFLICT(id) DO NOTHING and returns false.
    const source = SOURCES[0]!;
    const { runLog: firstLog } = captureRunLog();
    const { runLog: secondLog, events: secondEvents } = captureRunLog();

    const resolveBody = async (): Promise<import("../../src/ingest/fetcher.ts").ResolvedBody> => ({
      text: "body text that is long enough to pass prefilter easily with many words here",
      method: "readability" as const,
      wordCount: 15,
      fallbackReason: null,
    });
    const feedEntries = async () => [entry(source, "https://example.com/old-article", "Old Article Still In Feed")];

    // First run: article is genuinely new → inserted and logged.
    await processSource(0, [], firstLog, { client: db, fetchFeed: feedEntries, resolveBody });

    // Second run: same URL, same ID → ON CONFLICT fires, wasInserted=false.
    const stats = await processSource(0, [], secondLog, { client: db, fetchFeed: feedEntries, resolveBody });

    assert.equal(secondEvents.filter((e) => e.event === "article_ingested").length, 0);
    assert.equal(stats.duplicates, 1, "already-exists article should count as a duplicate");
    assert.equal(stats.passed_to_triage, 0, "should not overcount passed_to_triage");
  });
});
