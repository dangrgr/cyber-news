import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient, type Client } from "@libsql/client";

import { runMigrations } from "../../scripts/migrate.ts";
import {
  insertInvestigation,
  setInvestigationComplete,
  getInvestigation,
} from "../../src/turso/investigations.ts";
import { insertIncident, setInvestigationStatus, getIncident, queryByFilter } from "../../src/turso/incidents.ts";
import { insertArticle } from "../../src/turso/articles.ts";
import { getArticlesByIncidentId } from "../../src/turso/articles.ts";
import type { InvestigationResult } from "../../src/investigate/types.ts";

let client: Client;

beforeEach(async () => {
  client = createClient({ url: ":memory:" });
  await runMigrations(client, "migrations");
});

function baseIncident(id: string) {
  return {
    id,
    title: "t",
    summary: "s",
    incidentDate: "2026-03-11",
    confidence: "confirmed" as const,
    victimOrgsConfirmed: ["Stryker"],
    orgsMentioned: [],
    threatActorsAttributed: ["Handala"],
    actorsMentioned: [],
    cves: ["CVE-2026-0001"],
    initialAccessVector: null,
    ttps: [],
    impactJson: null,
    claimMarkersObserved: [],
    primarySource: "article_itself",
    sourceUrls: ["https://krebsonsecurity.com/2026/x"],
  };
}

describe("investigations repo", () => {
  it("insert → getInvestigation returns the pending row", async () => {
    await insertIncident(client, baseIncident("inc-1"));
    await insertInvestigation(client, "invg-1", "inc-1");
    const row = await getInvestigation(client, "invg-1");
    assert.ok(row);
    assert.equal(row!.incident_id, "inc-1");
    assert.equal(row!.completed_at, null);
  });

  it("setInvestigationComplete writes markdown, evidence, cost", async () => {
    await insertIncident(client, baseIncident("inc-1"));
    await insertInvestigation(client, "invg-1", "inc-1");
    const result: InvestigationResult = {
      incident_id: "inc-1",
      model: "claude-sonnet-4-6",
      markdown: "## Summary\nok",
      evidence: [{ n: 1, url: "https://krebsonsecurity.com/x", title: "t", tier: "tier_1", fetched_at: "2026-04-23", source_published_at: "2026-03-11", snippet: null }],
      confidence_overall: "high",
      sources_fetched: 1,
      cost_usd: 0.42,
      tool_calls: 5,
      terminated_reason: "end_turn",
      errors: [],
    };
    await setInvestigationComplete(client, "invg-1", result);
    const row = await getInvestigation(client, "invg-1");
    assert.ok(row!.completed_at);
    assert.equal(row!.model_used, "claude-sonnet-4-6");
    assert.equal(row!.cost_usd, 0.42);
    assert.match(row!.draft_markdown ?? "", /## Summary/);
    const evidence = JSON.parse(row!.evidence_json ?? "[]");
    assert.equal(evidence[0].tier, "tier_1");
  });
});

describe("incidents repo Phase 3 additions", () => {
  it("setInvestigationStatus updates and persists", async () => {
    await insertIncident(client, baseIncident("inc-1"));
    await setInvestigationStatus(client, "inc-1", "pending");
    let row = await getIncident(client, "inc-1");
    assert.equal(row!.investigation_status, "pending");
    await setInvestigationStatus(client, "inc-1", "complete");
    row = await getIncident(client, "inc-1");
    assert.equal(row!.investigation_status, "complete");
  });

  it("queryByFilter: filters by actor and cve", async () => {
    await insertIncident(client, baseIncident("inc-1"));
    await insertIncident(client, { ...baseIncident("inc-2"), threatActorsAttributed: ["ShinyHunters"], cves: [] });
    const byActor = await queryByFilter(client, { actor: "Handala" });
    assert.equal(byActor.length, 1);
    assert.equal(byActor[0]!.id, "inc-1");
    const byCve = await queryByFilter(client, { cve: "CVE-2026-0001" });
    assert.equal(byCve.length, 1);
    assert.equal(byCve[0]!.id, "inc-1");
    const all = await queryByFilter(client, {});
    assert.equal(all.length, 2);
  });

  it("queryByFilter: date range narrows results", async () => {
    await insertIncident(client, baseIncident("inc-a"));
    await insertIncident(client, { ...baseIncident("inc-b"), incidentDate: "2025-06-01" });
    const recent = await queryByFilter(client, { since: "2026-01-01" });
    assert.equal(recent.length, 1);
    assert.equal(recent[0]!.id, "inc-a");
  });
});

describe("articles repo Phase 3 additions", () => {
  it("getArticlesByIncidentId returns oldest-published first", async () => {
    await insertIncident(client, baseIncident("inc-1"));
    await insertArticle(client, {
      id: "a-late",
      sourceId: "bleeping",
      url: "https://www.bleepingcomputer.com/stryker",
      canonicalUrl: "https://www.bleepingcomputer.com/stryker",
      title: "Later article",
      author: null,
      publishedAt: "2026-03-13T09:00:00Z",
      rawText: "later body",
      stage: "published",
      incidentId: "inc-1",
    });
    await insertArticle(client, {
      id: "a-source-zero",
      sourceId: "krebs",
      url: "https://krebsonsecurity.com/2026/stryker",
      canonicalUrl: "https://krebsonsecurity.com/2026/stryker",
      title: "Source zero",
      author: "Brian Krebs",
      publishedAt: "2026-03-11T12:00:00Z",
      rawText: "original body",
      stage: "published",
      incidentId: "inc-1",
    });
    const rows = await getArticlesByIncidentId(client, "inc-1");
    assert.equal(rows.length, 2);
    assert.equal(rows[0]!.id, "a-source-zero");
    assert.equal(rows[1]!.id, "a-late");
  });

  it("getArticlesByIncidentId returns [] for unknown incident", async () => {
    const rows = await getArticlesByIncidentId(client, "inc-never");
    assert.equal(rows.length, 0);
  });
});
