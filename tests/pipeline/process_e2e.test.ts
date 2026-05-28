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
import { createDiscordClient } from "../../src/clients/discord.ts";
import type { RunLogger } from "../../src/util/run_log.ts";

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
          reason_code: null,
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
          reason_code: "vendor_marketing",
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
          reason_code: null,
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

describe("processPendingArticles: MAX_PROCESS_BATCH parsing", () => {
  it("treats empty-string MAX_PROCESS_BATCH as unset (defaults to 50, not 0)", async () => {
    // Regression: GH Actions ${{ vars.FOO }} expands to "" when the variable
    // is not set. Number("") is 0, which would silently return zero articles.
    for (let i = 0; i < 3; i++) {
      await seedArticle(db, { id: `art-batch-${i}` });
    }
    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({ decision: "skip", novel: false, significant: false, duplicate_of: null, reason: "x", reason_code: "not_an_incident" }),
      extract: () => "{}",
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
        MAX_PROCESS_BATCH: "", // <-- the bug: GH sets this to "" when var is unset
      },
    });
    assert.equal(summary.processed, 3, "empty MAX_PROCESS_BATCH should fall back to default, not 0");
  });
});

describe("processPendingArticles: DRY_RUN at the discord chokepoint", () => {
  it("DRY_RUN=1 short-circuits fetch and emits discord_payload events with dry_run=true", async () => {
    await seedArticle(db, { id: "art-dryrun" });

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "named victim and actor",
          reason_code: null,
        }),
      extract: () =>
        JSON.stringify({
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
          incident_date: "2026-04-20",
          confidence: "reported",
          claim_markers_observed: [],
          primary_source: "article_itself",
        }),
      factcheck: () => JSON.stringify({ overall: "pass", issues: [] }),
    });

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

    let fetchCalls = 0;
    const fetchSpy: typeof globalThis.fetch = async () => {
      fetchCalls++;
      return new Response(JSON.stringify({ id: "should-not-be-used" }), { status: 200 });
    };

    // Real discord client wired with DRY_RUN env + runLog. The chokepoint
    // is here, not in higher-level publishers — the whole point of DRY_RUN.
    const discord = createDiscordClient({
      webhookUrl: "https://discord.com/api/webhooks/X/Y",
      fetch: fetchSpy,
      env: { DRY_RUN: "1" },
      runLog,
    });

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
      runLog,
    });

    assert.equal(summary.published, 1);
    assert.equal(fetchCalls, 0, "DRY_RUN must short-circuit before fetch");

    const discordEvents = events.filter((e) => e.event === "discord_payload");
    assert.ok(discordEvents.length >= 1, "expected at least one discord_payload event");
    for (const ev of discordEvents) {
      assert.equal(ev.dry_run, true);
      assert.equal(typeof ev.payload_digest, "string");
    }
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
            reason_code: "not_an_incident",
          });
        }
        return JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "process reason",
          reason_code: null,
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

describe("processPendingArticles: per-stage cost rollup + article_done events (PR 2)", () => {
  it("accumulates per-stage costs, sets total = sum of stages, and emits one article_done per article", async () => {
    await seedArticle(db, { id: "art-cost-pub" });
    await seedArticle(db, { id: "art-cost-skip" });
    await seedArticle(db, { id: "art-cost-fcfail" });

    const anthropic = routedAnthropic({
      triage: (sys) => {
        if (sys.includes("art-cost-skip")) {
          return JSON.stringify({
            decision: "skip",
            novel: false,
            significant: false,
            duplicate_of: null,
            reason: "skip",
            reason_code: "not_an_incident",
          });
        }
        return JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "ok",
          reason_code: null,
        });
      },
      extract: (sys) => {
        const inc = sys.includes("art-cost-fcfail") ? "2024-01-01" : "2026-04-20";
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

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

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
      runLog,
    });

    // ----- ProcessSummary shape -----
    assert.ok(summary.costs, "summary.costs must exist");
    assert.ok(summary.costs.triage, "triage costs bucket present");
    assert.ok(summary.costs.extract, "extract costs bucket present");
    assert.ok(summary.costs.factcheck, "factcheck costs bucket present");
    assert.ok(summary.costs.total, "total costs bucket present");

    // Three articles → three triage calls.
    assert.equal(summary.costs.triage.calls, 3);
    // One published + one factcheck-failed (extract was attempted) → 2 extract calls.
    assert.equal(summary.costs.extract.calls, 2);
    // Only the published article reaches LLM factcheck (deterministic short-circuits the other).
    assert.equal(summary.costs.factcheck.calls, 1);

    // total = sum of stages
    assert.equal(
      summary.costs.total.calls,
      summary.costs.triage.calls + summary.costs.extract.calls + summary.costs.factcheck.calls,
    );
    assert.equal(
      summary.costs.total.input_tokens,
      summary.costs.triage.input_tokens +
        summary.costs.extract.input_tokens +
        summary.costs.factcheck.input_tokens,
    );
    assert.equal(
      summary.costs.total.output_tokens,
      summary.costs.triage.output_tokens +
        summary.costs.extract.output_tokens +
        summary.costs.factcheck.output_tokens,
    );
    // Each mocked call returns 100 in / 50 out tokens at Haiku rates ($1/M in, $5/M out)
    // → $0.0001 + $0.00025 = $0.00035 per call.
    const expectedTotal = summary.costs.total.calls * 0.00035;
    assert.ok(
      Math.abs(summary.costs.total.cost_usd - expectedTotal) < 1e-9,
      `total cost ${summary.costs.total.cost_usd} ~ expected ${expectedTotal}`,
    );

    // model_calls preserves backward-compat shape and equals total.calls.
    assert.equal(summary.model_calls, summary.costs.total.calls);

    // ----- article_done events -----
    const articleDones = events.filter((e) => e.event === "article_done");
    assert.equal(articleDones.length, 3, "one article_done per article");

    const byTerminalState = new Map<string, Record<string, unknown>>();
    for (const ev of articleDones) {
      assert.equal(typeof ev.article_id, "string");
      assert.equal(typeof ev.article_url, "string");
      assert.equal(ev.source_id, "krebs");
      assert.equal(typeof ev.duration_ms, "number");
      assert.ok(ev.stages, "stages object present");
      byTerminalState.set(String(ev.terminal_state), ev);
    }

    assert.ok(byTerminalState.has("published"));
    assert.ok(byTerminalState.has("triage_rejected"));
    assert.ok(byTerminalState.has("factcheck_failed"));

    // Published article touched all three stages.
    const pubStages = (byTerminalState.get("published") as { stages: Record<string, unknown> }).stages;
    assert.ok(pubStages.triage, "published article has triage stage");
    assert.ok(pubStages.extract, "published article has extract stage");
    assert.ok(pubStages.factcheck, "published article has factcheck stage");

    // Triage-rejected article only touched triage.
    const skipStages = (byTerminalState.get("triage_rejected") as { stages: Record<string, unknown> })
      .stages;
    assert.ok(skipStages.triage);
    assert.equal(skipStages.extract, undefined);
    assert.equal(skipStages.factcheck, undefined);

    // Factcheck-failed (deterministic short-circuit) touched triage + extract but not LLM factcheck.
    const failStages = (byTerminalState.get("factcheck_failed") as { stages: Record<string, unknown> })
      .stages;
    assert.ok(failStages.triage);
    assert.ok(failStages.extract);
    assert.equal(failStages.factcheck, undefined);
  });

  it("emits article_done with terminal_state='error' when an unhandled exception bubbles", async () => {
    await seedArticle(db, { id: "art-boom" });

    const anthropic: AnthropicClient = {
      async messagesCreate() {
        // Throw a non-pattern error (not a parse/schema error) so it propagates
        // out of processOne into the outer catch.
        throw new Error("kaboom: simulated upstream failure");
      },
    };

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

    const discord = recordingDiscord();
    const summary = await processPendingArticles({
      db,
      anthropic,
      discord,
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
      runLog,
    });

    assert.equal(summary.processed, 1);
    assert.equal(summary.factcheck_failed, 1);

    const articleDones = events.filter((e) => e.event === "article_done");
    assert.equal(articleDones.length, 1);
    assert.equal(articleDones[0]!.terminal_state, "error");
    assert.equal(articleDones[0]!.article_id, "art-boom");
  });
});

describe("processPendingArticles: failure codes (PR 3)", () => {
  it("triage skip stamps mapped failure_code on article_done and emits dedicated triage_rejected event", async () => {
    await seedArticle(db, { id: "art-skip-marketing" });

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "skip",
          novel: false,
          significant: false,
          duplicate_of: null,
          reason: "Vendor marketing content.",
          reason_code: "vendor_marketing",
        }),
      extract: () => "{}",
      factcheck: () => "{}",
    });

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

    await processPendingArticles({
      db,
      anthropic: anthropic.client,
      discord: recordingDiscord(),
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
      runLog,
    });

    const triageEvents = events.filter((e) => e.event === "triage_rejected");
    assert.equal(triageEvents.length, 1);
    assert.equal(triageEvents[0]!.failure_code, "triage_vendor_marketing");
    assert.match(String(triageEvents[0]!.failure_reason), /Vendor marketing/);

    const articleDones = events.filter((e) => e.event === "article_done");
    assert.equal(articleDones.length, 1);
    assert.equal(articleDones[0]!.terminal_state, "triage_rejected");
    assert.equal(articleDones[0]!.failure_code, "triage_vendor_marketing");
  });

  it("deterministic date-window failure emits factcheck_failed with failure_codes array and stamps article_done", async () => {
    await seedArticle(db, { id: "art-fc-date" });

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "valid",
          reason_code: null,
        }),
      extract: () =>
        JSON.stringify({
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
          incident_date: "2024-01-01", // outside [pub-90d, pub+7d]
          confidence: "reported",
          claim_markers_observed: [],
          primary_source: "article_itself",
        }),
      factcheck: () => JSON.stringify({ overall: "pass", issues: [] }),
    });

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

    await processPendingArticles({
      db,
      anthropic: anthropic.client,
      discord: recordingDiscord(),
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
      runLog,
    });

    const fcEvents = events.filter((e) => e.event === "factcheck_failed");
    assert.equal(fcEvents.length, 1);
    assert.equal(fcEvents[0]!.failure_code, "factcheck_date_out_of_window");
    assert.equal(fcEvents[0]!.stage_reached, "factcheck_deterministic");
    assert.deepEqual(fcEvents[0]!.failure_codes, ["factcheck_date_out_of_window"]);
    // Structured detail must carry the actual dates, not just the kind, so the
    // #2 failure (date_out_of_window) is debuggable from the log alone. Keys are
    // snake_case to match the run-log field convention.
    const details = fcEvents[0]!.failure_details as Array<Record<string, unknown>>;
    assert.equal(details.length, 1);
    assert.equal(details[0]!.kind, "date_out_of_window");
    assert.equal(details[0]!.incident_date, "2024-01-01");
    assert.ok(typeof details[0]!.published_at === "string");

    const articleDones = events.filter((e) => e.event === "article_done");
    assert.equal(articleDones.length, 1);
    assert.equal(articleDones[0]!.terminal_state, "factcheck_failed");
    assert.equal(articleDones[0]!.failure_code, "factcheck_date_out_of_window");
  });

  it("malformed JSON from a pattern emits pattern_parse_error and article_error with raw_model_output", async () => {
    await seedArticle(db, { id: "art-malformed" });

    // Triage returns garbage on every attempt — runner retries once then throws
    // PatternMalformedJsonError, which the outer catch turns into terminal=error.
    const anthropic: AnthropicClient = {
      async messagesCreate(params) {
        return {
          text: "this is not json at all { ::: ",
          usage: { input_tokens: 10, output_tokens: 5 },
          model: params.model,
        };
      },
    };

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

    await processPendingArticles({
      db,
      anthropic,
      discord: recordingDiscord(),
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
      runLog,
    });

    const parseErrors = events.filter((e) => e.event === "pattern_parse_error");
    assert.equal(parseErrors.length, 1, "runner should emit one pattern_parse_error after retry");
    assert.equal(parseErrors[0]!.error_kind, "json_parse");
    assert.equal(parseErrors[0]!.pattern, "triage");
    assert.match(String(parseErrors[0]!.raw_output), /not json/);

    const articleErrors = events.filter((e) => e.event === "article_error");
    assert.equal(articleErrors.length, 1);
    assert.equal(articleErrors[0]!.failure_code, "pattern_json_invalid");
    assert.match(String(articleErrors[0]!.raw_model_output), /not json/);

    const articleDones = events.filter((e) => e.event === "article_done");
    assert.equal(articleDones.length, 1);
    assert.equal(articleDones[0]!.terminal_state, "error");
    assert.equal(articleDones[0]!.failure_code, "pattern_json_invalid");
  });
});

describe("processPendingArticles: null title fallback", () => {
  it("extract returning null title falls back to article.title from RSS", async () => {
    const artId = await seedArticle(db, {
      id: "art-null-title",
      title: "RSS Feed Title From Ingest",
    });

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "Named victim.",
          reason_code: null,
        }),
      extract: () =>
        JSON.stringify({
          title: null,
          summary: "ShinyHunters breached Cisco.",
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
          incident_date: null,
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

    assert.equal(summary.published, 1, "should publish despite null extract title");
    assert.equal(discord.posts.length, 1);

    const row = await db.execute({
      sql: `SELECT incident_id FROM articles WHERE id = ?`,
      args: [artId],
    });
    const incidentId = String(row.rows[0]!.incident_id);

    const incident = await db.execute({
      sql: `SELECT title FROM incidents WHERE id = ?`,
      args: [incidentId],
    });
    assert.equal(
      String(incident.rows[0]!.title),
      "RSS Feed Title From Ingest",
      "incident title should fall back to RSS article.title when extract returns null",
    );
  });

  it("empty-string extract title also falls back to article.title", async () => {
    const artId = await seedArticle(db, {
      id: "art-empty-title",
      title: "RSS Title For Empty",
    });

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "Named victim.",
          reason_code: null,
        }),
      extract: () =>
        JSON.stringify({
          title: "", // empty string, distinct from null
          summary: "ShinyHunters breached Cisco.",
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
          incident_date: null,
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

    assert.equal(summary.published, 1);
    const row = await db.execute({
      sql: `SELECT incident_id FROM articles WHERE id = ?`,
      args: [artId],
    });
    const incidentId = String(row.rows[0]!.incident_id);
    const incident = await db.execute({
      sql: `SELECT title FROM incidents WHERE id = ?`,
      args: [incidentId],
    });
    assert.equal(String(incident.rows[0]!.title), "RSS Title For Empty");
  });

  it("reconcile re-run extract also gets the RSS title fallback", async () => {
    // Regression guard: the reconcile path re-invokes runExtract. Both the
    // initial pass and the re-run must apply the null-title coercion, or
    // reconcile will compare null vs article.title and disagree.
    await seedArticle(db, {
      id: "art-reconcile-null-title",
      title: "RSS Title For Reconcile",
    });

    let extractCalls = 0;
    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "Named victim.",
          reason_code: null,
        }),
      extract: () => {
        extractCalls++;
        return JSON.stringify({
          title: null, // both passes return null; coercion must fire twice
          summary: "ShinyHunters breached Cisco.",
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
          incident_date: null,
          confidence: "reported",
          claim_markers_observed: [],
          primary_source: "article_itself",
        });
      },
      // Flag summary with OVERREACH to trigger the reconcile re-run path.
      factcheck: () =>
        JSON.stringify({
          overall: "fail",
          issues: [
            {
              field: "summary",
              verdict: "OVERREACH",
              article_evidence: null,
              detail: "force reconcile",
            },
          ],
        }),
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

    assert.ok(extractCalls >= 2, `expected reconcile to re-run extract; got ${extractCalls} calls`);
    assert.equal(summary.published, 1, "reconcile should publish: both passes share the same coerced title");
    assert.equal(discord.posts.length, 1);
  });
});

describe("processPendingArticles: corroboration", () => {
  it("second article with same victim+actor+date PATCHes the existing incident and emits incident_corroborated", async () => {
    // Two sources reporting the same story. incidentKey() keys on
    // (incident_date, victim_org[0], threat_actor[0]) — both extractions agree,
    // so they collapse to the same deterministic incident id.
    await seedArticle(db, {
      id: "art-krebs",
      sourceId: "krebs",
      url: "https://krebsonsecurity.com/shinyhunters-cisco",
      canonicalUrl: "https://krebsonsecurity.com/shinyhunters-cisco",
    });
    await seedArticle(db, {
      id: "art-bleep",
      sourceId: "bleepingcomputer",
      url: "https://www.bleepingcomputer.com/news/security/shinyhunters-cisco",
      canonicalUrl: "https://www.bleepingcomputer.com/news/security/shinyhunters-cisco",
    });

    const sharedExtraction = JSON.stringify({
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
    });

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "Named victim and actor.",
          reason_code: null,
        }),
      extract: () => sharedExtraction,
      factcheck: () => JSON.stringify({ overall: "pass", issues: [] }),
    });

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

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
      runLog,
    });

    assert.equal(summary.published, 2, "both articles should reach published stage");
    assert.equal(discord.posts.length, 1, "first article posts a new Discord message");
    assert.equal(discord.patches.length, 1, "second article corroborates via PATCH, not a new post");

    // Both articles attached to the same incident; incident accumulates both source URLs.
    const articles = await db.execute({
      sql: `SELECT id, incident_id FROM articles WHERE id IN (?, ?)`,
      args: ["art-krebs", "art-bleep"],
    });
    const incidentIds = new Set(articles.rows.map((r) => String(r.incident_id)));
    assert.equal(incidentIds.size, 1, "both articles share one incident_id");
    const incidentId = [...incidentIds][0]!;

    const inc = await db.execute({
      sql: `SELECT source_urls, corroboration_count FROM incidents WHERE id = ?`,
      args: [incidentId],
    });
    const sourceUrls = JSON.parse(String(inc.rows[0]!.source_urls)) as string[];
    assert.deepEqual(
      sourceUrls.sort(),
      [
        "https://krebsonsecurity.com/shinyhunters-cisco",
        "https://www.bleepingcomputer.com/news/security/shinyhunters-cisco",
      ].sort(),
    );
    assert.equal(Number(inc.rows[0]!.corroboration_count), 2);

    // Exactly one incident_corroborated event, fired by the second article.
    const corroborated = events.filter((e) => e.event === "incident_corroborated");
    assert.equal(corroborated.length, 1);
    const ev = corroborated[0]!;
    assert.equal(ev.incident_id, incidentId);
    assert.equal(ev.corroborator_article_id, "art-bleep");
    assert.equal(ev.corroborator_source_id, "bleepingcomputer");
    assert.equal(ev.corroborator_source_tier, "secondary");
    assert.equal(ev.corroboration_count_after, 2);
    assert.ok(
      typeof ev.time_since_first_publish_ms === "number" && ev.time_since_first_publish_ms >= 0,
      "time_since_first_publish_ms should be a non-negative number",
    );

    // The first article CREATES the incident; the second CORROBORATES it.
    // Exactly one incident_created, fired by the creator (not the corroborator).
    const created = events.filter((e) => e.event === "incident_created");
    assert.equal(created.length, 1, "only the first article creates the incident");
    assert.equal(created[0]!.incident_id, incidentId);
    assert.equal(created[0]!.article_id, "art-krebs");

    // Both published article_done events carry the shared incident_id, so a
    // future audit can group published articles by incident from the run log.
    const dones = events.filter(
      (e) => e.event === "article_done" && e.terminal_state === "published",
    );
    assert.equal(dones.length, 2);
    for (const d of dones) assert.equal(d.incident_id, incidentId);
  });
});

describe("processPendingArticles: incident_id visibility", () => {
  it("published article_done carries incident_id and incident_created logs the key components", async () => {
    const artId = await seedArticle(db, { id: "art-vis" });

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "process",
          novel: true,
          significant: true,
          duplicate_of: null,
          reason: "Named victim and actor.",
          reason_code: null,
        }),
      extract: () =>
        JSON.stringify({
          title: "ShinyHunters breaches Cisco via Salesforce",
          summary: "ShinyHunters exfiltrated 4.2M Cisco records.",
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

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

    const summary = await processPendingArticles({
      db,
      anthropic: anthropic.client,
      discord: recordingDiscord(),
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
      runLog,
    });
    assert.equal(summary.published, 1);

    // The DB is the source of truth for which incident the article attached to.
    const row = await db.execute({
      sql: `SELECT incident_id FROM articles WHERE id = ?`,
      args: [artId],
    });
    const incidentId = String(row.rows[0]!.incident_id);
    assert.match(incidentId, /^inc-/);

    // article_done for the published article carries that same incident_id.
    const done = events.find(
      (e) => e.event === "article_done" && e.article_id === artId,
    );
    assert.ok(done, "expected an article_done for the published article");
    assert.equal(done!.terminal_state, "published");
    assert.equal(done!.incident_id, incidentId);

    // incident_created fires once, logging the exact key components the
    // deterministic incident id is derived from (so keying misses are debuggable).
    const created = events.filter((e) => e.event === "incident_created");
    assert.equal(created.length, 1);
    const ev = created[0]!;
    assert.equal(ev.incident_id, incidentId);
    assert.equal(ev.article_id, artId);
    assert.equal(ev.source_id, "krebs");
    assert.equal(ev.key_date, "2026-04-20");
    assert.equal(ev.key_victim, "cisco");
    assert.equal(ev.key_actor, "shinyhunters");
  });

  it("non-published articles emit no incident_id and no incident_created", async () => {
    await seedArticle(db, { id: "art-vis-skip" });

    const anthropic = routedAnthropic({
      triage: () =>
        JSON.stringify({
          decision: "skip",
          novel: false,
          significant: false,
          duplicate_of: null,
          reason: "Vendor marketing content.",
          reason_code: "vendor_marketing",
        }),
      extract: () => "{}",
      factcheck: () => "{}",
    });

    const events: Array<Record<string, unknown>> = [];
    const runLog: RunLogger = {
      runId: "test-run",
      stage: "process",
      logCall: () => {},
      logEvent: (e) => {
        events.push(e);
      },
      finishRun: async () => {},
    };

    await processPendingArticles({
      db,
      anthropic: anthropic.client,
      discord: recordingDiscord(),
      brave: emptyBrave,
      cveCache: { client: db, nvd: alwaysExistsNvd },
      env: {
        MODEL_TRIAGE: "claude-haiku-4-5",
        MODEL_EXTRACTION: "claude-haiku-4-5",
        MODEL_FACTCHECK: "claude-haiku-4-5",
      },
      runLog,
    });

    const done = events.find((e) => e.event === "article_done");
    assert.equal(done!.terminal_state, "triage_rejected");
    assert.equal(done!.incident_id, undefined, "rejected article has no incident_id");
    assert.equal(
      events.filter((e) => e.event === "incident_created").length,
      0,
      "no incident is created for a rejected article",
    );
  });
});
