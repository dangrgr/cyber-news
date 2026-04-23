// End-to-end Phase 2 orchestrator test. In-memory libSQL, all I/O mocked
// (Anthropic, NVD, Brave, Discord). Exercises the three terminal states:
// published, triage_rejected, factcheck_failed.

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient, type Client } from "@libsql/client";

import type { AnthropicClient, MessagesCreateParams } from "../../src/clients/anthropic.ts";
import type { BraveClient } from "../../src/clients/brave.ts";
import type { DiscordClient } from "../../src/clients/discord.ts";
import type { NvdClient } from "../../src/clients/nvd.ts";

import { runMigrations } from "../../scripts/migrate.ts";
import { insertArticle } from "../../src/turso/articles.ts";
import { processPendingArticles } from "../../src/pipeline/process.ts";
import { resetPatternCaches } from "../../src/patterns/runner.ts";

let db: Client;

beforeEach(async () => {
  db = createClient({ url: ":memory:" });
  await runMigrations(db, "migrations");
  resetPatternCaches();
});

// --- Mocks ---

interface RoutedAnthropic {
  client: AnthropicClient;
  calls: MessagesCreateParams[];
}

function routedAnthropic(routes: {
  triage: (input: string) => string;
  extract: (input: string) => string;
  factcheck: (input: string) => string;
}): RoutedAnthropic {
  const calls: MessagesCreateParams[] = [];
  return {
    calls,
    client: {
      async messagesCreate(params) {
        calls.push(params);
        const system = params.system;
        let text: string;
        if (system.includes("cybersecurity news triage classifier")) {
          text = routes.triage(system);
        } else if (system.includes("extracting structured cybersecurity incident data")) {
          text = routes.extract(system);
        } else if (system.includes("verifying that a structured extraction is supported")) {
          text = routes.factcheck(system);
        } else {
          throw new Error("routedAnthropic: could not classify system prompt");
        }
        return { text, usage: { input_tokens: 100, output_tokens: 50 }, model: params.model };
      },
    },
  };
}

const alwaysExistsNvd: NvdClient = {
  async lookup() {
    return { exists: true, cvssV31: 9.8, severity: "CRITICAL", summary: "", rawJson: "{}" };
  },
};

const emptyBrave: BraveClient = {
  async search() {
    return [];
  },
};

function recordingDiscord(): DiscordClient & { posts: unknown[]; patches: unknown[] } {
  const posts: unknown[] = [];
  const patches: unknown[] = [];
  let nextId = 1;
  return {
    posts,
    patches,
    async postMessage(p) {
      posts.push(p);
      return { messageId: `msg-${nextId++}` };
    },
    async patchMessage(id, p) {
      patches.push({ id, payload: p });
    },
  };
}

// --- Test fixtures: seed articles ---

async function seedArticle(
  db: Client,
  overrides: Partial<Parameters<typeof insertArticle>[1]> = {},
): Promise<string> {
  const id = overrides.id ?? "art-" + Math.random().toString(36).slice(2, 10);
  await insertArticle(db, {
    id,
    sourceId: "krebs",
    url: `https://krebsonsecurity.com/${id}`,
    canonicalUrl: `https://krebsonsecurity.com/${id}`,
    title: "Sample article",
    author: null,
    publishedAt: "2026-04-22T00:00:00Z",
    rawText:
      "ShinyHunters breached Cisco's Salesforce instance and exfiltrated 4.2 million records. " +
      "Cisco confirmed unauthorized third-party access in an SEC 8-K filing.",
    stage: "deduped",
    ...overrides,
  });
  return id;
}

// --- Scenarios ---

describe("processPendingArticles: happy path", () => {
  it("triage=process → extract → factcheck=pass → publish", async () => {
    const artId = await seedArticle(db);

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "Named victim and actor.",
        }),
      extract: () =>
        JSON.stringify({
          title: "ShinyHunters breaches Cisco via Salesforce",
          summary: "ShinyHunters exfiltrated 4.2M Cisco records; Cisco confirmed access in SEC 8-K.",
          victim_orgs_confirmed: ["Cisco"],
          orgs_mentioned: [],
          threat_actors_attributed: ["ShinyHunters"],
          actors_mentioned: [],
          cves: [],
          initial_access_vector: "Salesforce vishing",
          ttps: [],
          impact: {
            affected_count: 4200000,
            affected_count_unit: "records",
            data_exfil_size: null,
            sector: null,
            geographic_scope: null,
            service_disruption: null,
          },
          incident_date: "2026-04-20",
          confidence: "reported",
          claim_markers_observed: [],
          primary_source: "article_itself",
        }),
      factcheck: () => JSON.stringify({ overall: "pass", issues: [] }),
    });

    const discord = recordingDiscord();

    const summary = await processPendingArticles({
      db,
      anthropic: anthropic.client,
      discord,
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
    });

    assert.deepEqual(
      { published: summary.published, rejected: summary.triage_rejected, failed: summary.factcheck_failed },
      { published: 1, rejected: 0, failed: 0 },
    );
    assert.equal(discord.posts.length, 1);

    // Article now at stage=published.
    const row = await db.execute({
      sql: `SELECT stage_reached, incident_id FROM articles WHERE id = ?`,
      args: [artId],
    });
    assert.equal(String(row.rows[0]!.stage_reached), "published");
    assert.ok(row.rows[0]!.incident_id);
  });
});

describe("processPendingArticles: triage skip", () => {
  it("stamps triage_rejected and does not call extract/factcheck", async () => {
    const artId = await seedArticle(db, { id: "art-skip" });

    let extractCalls = 0;
    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "skip",
          novel: false,
          significant: false,
          duplicate_of: null,
          reason: "Vendor marketing content.",
        }),
      extract: () => {
        extractCalls++;
        return "{}";
      },
      factcheck: () => "{}",
    });

    const discord = recordingDiscord();
    const summary = await processPendingArticles({
      db,
      anthropic: anthropic.client,
      discord,
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
    });

    assert.equal(summary.triage_rejected, 1);
    assert.equal(summary.published, 0);
    assert.equal(extractCalls, 0);
    assert.equal(discord.posts.length, 0);

    const row = await db.execute({
      sql: `SELECT stage_reached, failure_reason FROM articles WHERE id = ?`,
      args: [artId],
    });
    assert.equal(String(row.rows[0]!.stage_reached), "triage_rejected");
    assert.match(String(row.rows[0]!.failure_reason), /Vendor marketing/);
  });
});

describe("processPendingArticles: factcheck fail (deterministic date window)", () => {
  it("stamps factcheck_failed without calling LLM factcheck", async () => {
    const artId = await seedArticle(db, { id: "art-fc-fail" });

    let factcheckCalls = 0;
    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "valid incident",
        }),
      extract: () =>
        JSON.stringify({
          title: "Some incident",
          summary: "Summary.",
          victim_orgs_confirmed: ["Cisco"],
          orgs_mentioned: [],
          threat_actors_attributed: ["ShinyHunters"],
          actors_mentioned: [],
          cves: [],
          initial_access_vector: null,
          ttps: [],
          impact: {
            affected_count: null,
            affected_count_unit: null,
            data_exfil_size: null,
            sector: null,
            geographic_scope: null,
            service_disruption: null,
          },
          incident_date: "2024-01-01", // way outside [pub-90d, pub+7d]
          confidence: "reported",
          claim_markers_observed: [],
          primary_source: "article_itself",
        }),
      factcheck: () => {
        factcheckCalls++;
        return "{}";
      },
    });

    const discord = recordingDiscord();
    const summary = await processPendingArticles({
      db,
      anthropic: anthropic.client,
      discord,
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
    });

    assert.equal(summary.factcheck_failed, 1);
    assert.equal(factcheckCalls, 0, "deterministic fail should short-circuit the LLM factcheck");
    assert.equal(discord.posts.length, 0);

    const row = await db.execute({
      sql: `SELECT stage_reached, failure_reason FROM articles WHERE id = ?`,
      args: [artId],
    });
    assert.equal(String(row.rows[0]!.stage_reached), "factcheck_failed");
    assert.match(String(row.rows[0]!.failure_reason), /deterministic:date_out_of_window/);
  });
});

describe("processPendingArticles: mixed batch", () => {
  it("processes three articles into three different terminal states", async () => {
    await seedArticle(db, { id: "art-pub" });
    await seedArticle(db, { id: "art-skip" });
    await seedArticle(db, { id: "art-fcfail" });

    const anthropic = routedAnthropic({
      triage: (sys) => {
        if (sys.includes("art-skip")) {
          return JSON.stringify({
            decision: "skip",
            novel: false,
            significant: false,
            duplicate_of: null,
            reason: "skip reason",
          });
        }
        return JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "process reason",
        });
      },
      extract: (sys) => {
        const inc = sys.includes("art-fcfail") ? "2024-01-01" : "2026-04-20";
        return JSON.stringify({
          title: "T",
          summary: "S",
          victim_orgs_confirmed: ["Cisco"],
          orgs_mentioned: [],
          threat_actors_attributed: ["ShinyHunters"],
          actors_mentioned: [],
          cves: [],
          initial_access_vector: null,
          ttps: [],
          impact: {
            affected_count: null,
            affected_count_unit: null,
            data_exfil_size: null,
            sector: null,
            geographic_scope: null,
            service_disruption: null,
          },
          incident_date: inc,
          confidence: "reported",
          claim_markers_observed: [],
          primary_source: "article_itself",
        });
      },
      factcheck: () => JSON.stringify({ overall: "pass", issues: [] }),
    });

    const discord = recordingDiscord();
    const summary = await processPendingArticles({
      db,
      anthropic: anthropic.client,
      discord,
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
    });

    assert.equal(summary.processed, 3);
    assert.equal(summary.published, 1);
    assert.equal(summary.triage_rejected, 1);
    assert.equal(summary.factcheck_failed, 1);
    assert.equal(discord.posts.length, 1);
  });
});
