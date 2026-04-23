import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient, type Client } from "@libsql/client";

import { runMigrations } from "../../scripts/migrate.ts";
import { insertArticle, queryByStage, setStage } from "../../src/turso/articles.ts";

let client: Client;

beforeEach(async () => {
  client = createClient({ url: ":memory:" });
  await runMigrations(client, "migrations");
});

function art(id: string, stage: Parameters<typeof insertArticle>[1]["stage"], publishedAt: string) {
  return {
    id,
    sourceId: "krebs",
    url: `https://example.com/${id}`,
    canonicalUrl: `https://example.com/${id}`,
    title: `Article ${id}`,
    author: null,
    publishedAt,
    rawText: "body...",
    stage,
  };
}

describe("queryByStage", () => {
  it("returns articles at the requested stage, oldest published first", async () => {
    await insertArticle(client, art("a1", "deduped", "2026-04-10T00:00:00Z"));
    await insertArticle(client, art("a2", "deduped", "2026-04-05T00:00:00Z"));
    await insertArticle(client, art("a3", "pre_filtered", "2026-04-06T00:00:00Z"));
    const rows = await queryByStage(client, "deduped", 10);
    assert.deepEqual(rows.map((r) => r.id), ["a2", "a1"]);
  });

  it("respects the limit parameter", async () => {
    await insertArticle(client, art("a1", "deduped", "2026-04-01T00:00:00Z"));
    await insertArticle(client, art("a2", "deduped", "2026-04-02T00:00:00Z"));
    await insertArticle(client, art("a3", "deduped", "2026-04-03T00:00:00Z"));
    const rows = await queryByStage(client, "deduped", 2);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((r) => r.id), ["a1", "a2"]);
  });
});

describe("setStage", () => {
  it("updates stage and failure_reason", async () => {
    await insertArticle(client, art("a1", "deduped", "2026-04-10T00:00:00Z"));
    await setStage(client, "a1", "factcheck_failed", "overreach_confidence");
    const rows = await queryByStage(client, "factcheck_failed", 10);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.failure_reason, "overreach_confidence");
  });

  it("clears failure_reason when set to null (default)", async () => {
    await insertArticle(client, art("a1", "deduped", "2026-04-10T00:00:00Z"));
    await setStage(client, "a1", "factcheck_failed", "something");
    await setStage(client, "a1", "published");
    const rows = await queryByStage(client, "published", 10);
    assert.equal(rows[0]!.failure_reason, null);
  });
});
