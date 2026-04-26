import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
  MessagesWithToolsClient,
  MessagesWithToolsParams,
  MessagesWithToolsResponse,
} from "../../src/clients/anthropic_tools.ts";
import { runInvestigation, parseFinalOutput } from "../../src/investigate/orchestrator.ts";
import type { InvestigationInput } from "../../src/investigate/types.ts";
import type { IncidentRow } from "../../src/turso/incidents.ts";
import type { ArticleRow } from "../../src/turso/articles.ts";

function mockClient(responses: MessagesWithToolsResponse[]): {
  client: MessagesWithToolsClient;
  calls: MessagesWithToolsParams[];
} {
  const calls: MessagesWithToolsParams[] = [];
  let i = 0;
  return {
    calls,
    client: {
      async create(params) {
        calls.push(params);
        if (i >= responses.length) throw new Error(`unexpected call #${i + 1}`);
        return responses[i++]!;
      },
    },
  };
}

function textResp(text: string, usage = { input_tokens: 1000, output_tokens: 500 }): MessagesWithToolsResponse {
  return {
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    usage,
    model: "claude-sonnet-4-6",
  };
}

function toolResp(toolName: string, input: Record<string, unknown>, usage = { input_tokens: 1000, output_tokens: 500 }): MessagesWithToolsResponse {
  return {
    content: [{ type: "tool_use", id: "call-1", name: toolName, input }],
    stop_reason: "tool_use",
    usage,
    model: "claude-sonnet-4-6",
  };
}

function sampleIncident(): IncidentRow {
  return {
    id: "inc-1",
    first_seen_at: "2026-03-11T09:00:00Z",
    last_updated_at: "2026-03-11T09:00:00Z",
    title: "Stryker wiper attack",
    summary: "Handala claims ~50TB exfil, confirmed Intune wipe.",
    incident_date: "2026-03-11",
    confidence: "confirmed",
    victim_orgs_confirmed: ["Stryker"],
    orgs_mentioned: [],
    threat_actors_attributed: ["Handala"],
    actors_mentioned: [],
    cves: [],
    initial_access_vector: null,
    ttps: [],
    impact_json: null,
    campaign_tags: [],
    claim_markers_observed: [],
    primary_source: "article_itself",
    corroboration_count: 1,
    corroboration_tier1: 0,
    corroboration_tier2: 0,
    source_urls: ["https://krebsonsecurity.com/2026/stryker"],
    discord_message_id: null,
    investigation_status: "none",
  };
}

function sampleArticle(): ArticleRow {
  return {
    id: "art-1",
    source_id: "krebs",
    url: "https://krebsonsecurity.com/2026/stryker",
    canonical_url: "https://krebsonsecurity.com/2026/stryker",
    title: "Stryker wiper attack",
    author: "Brian Krebs",
    published_at: "2026-03-11T12:00:00Z",
    ingested_at: "2026-03-11T12:30:00Z",
    raw_text: "Full article body here.",
    stage_reached: "published",
    failure_reason: null,
    incident_id: "inc-1",
  };
}

const FAKE_PROMPT = "System prompt.\n<incident>id: {incident_id}</incident>\n<source_zero>{source_zero_url}</source_zero>\n<phase_2_extraction>{extraction_json}</phase_2_extraction>\n<related_incidents>{related_incidents_block}</related_incidents>\n{incident_title}\n{incident_confidence}\n{source_zero_published_at}\n{source_zero_source}\n{source_zero_raw_text}";

function baseInput(): InvestigationInput {
  return {
    incident: sampleIncident(),
    sourceZero: sampleArticle(),
    relatedIncidents: [],
  };
}

const FINAL_MARKDOWN = `## Summary
Handala claims exfil from Stryker [1].

## Sources
[1] Krebs on Security — Stryker Attack — https://krebsonsecurity.com/2026/stryker — accessed: 2026-04-23 — published: 2026-03-11 — tier: tier_1
[2] CISA — Advisory — https://www.cisa.gov/advisory/stryker — accessed: 2026-04-23 — published: 2026-03-15 — tier: gov_advisory

\`\`\`json
{"cost_budget_remaining": 1.2, "sources_fetched": 2, "confidence_overall": "high"}
\`\`\``;

describe("runInvestigation: happy path", () => {
  it("ends on end_turn, parses markdown, evidence, and footer", async () => {
    const { client, calls } = mockClient([textResp(FINAL_MARKDOWN)]);
    const result = await runInvestigation(baseInput(), {
      client,
      model: "claude-sonnet-4-6",
      tools: {},
      readFile: async () => FAKE_PROMPT,
    });
    assert.equal(calls.length, 1);
    assert.equal(result.terminated_reason, "end_turn");
    assert.equal(result.confidence_overall, "high");
    assert.equal(result.sources_fetched, 2);
    assert.equal(result.evidence.length, 2);
    assert.equal(result.evidence[0]!.tier, "tier_1");
    assert.equal(result.evidence[1]!.tier, "gov_advisory");
    assert.match(result.markdown, /## Summary/);
    assert.ok(!result.markdown.includes("```json"), "footer stripped from markdown");
    assert.ok(result.cost_usd > 0);
    assert.equal(result.tool_calls, 0);
  });
});

describe("runInvestigation: tool use loop", () => {
  it("runs a custom tool then returns final markdown", async () => {
    let captured: unknown = null;
    const { client, calls } = mockClient([
      toolResp("fetch_url", { url: "https://krebsonsecurity.com/2026/stryker" }),
      textResp(FINAL_MARKDOWN),
    ]);
    const result = await runInvestigation(baseInput(), {
      client,
      model: "claude-sonnet-4-6",
      tools: {
        fetch_url: async (input) => {
          captured = input;
          return JSON.stringify({ url: "x", status: 200, text: "ok" });
        },
      },
      readFile: async () => FAKE_PROMPT,
    });
    assert.equal(calls.length, 2);
    assert.equal(result.tool_calls, 1);
    assert.deepEqual(captured, { url: "https://krebsonsecurity.com/2026/stryker" });
    assert.equal(result.terminated_reason, "end_turn");
    // second call must include the assistant tool_use + user tool_result history
    const secondMessages = calls[1]!.messages;
    assert.equal(secondMessages.length, 3);
    assert.equal(secondMessages[1]!.role, "assistant");
    assert.equal(secondMessages[2]!.role, "user");
  });

  it("returns tool_raised error to the model when a tool throws, does not abort", async () => {
    const { client } = mockClient([
      toolResp("fetch_url", { url: "https://krebsonsecurity.com/x" }),
      textResp(FINAL_MARKDOWN),
    ]);
    const result = await runInvestigation(baseInput(), {
      client,
      model: "claude-sonnet-4-6",
      tools: {
        fetch_url: async () => {
          throw new Error("network down");
        },
      },
      readFile: async () => FAKE_PROMPT,
    });
    assert.equal(result.terminated_reason, "end_turn");
    assert.ok(result.errors.some((e) => e.includes("tool_fetch_url")), result.errors.join(";"));
  });

  it("responds with unknown_tool when the model calls a tool that's not registered", async () => {
    const { client } = mockClient([
      toolResp("nonexistent", {}),
      textResp(FINAL_MARKDOWN),
    ]);
    const result = await runInvestigation(baseInput(), {
      client,
      model: "claude-sonnet-4-6",
      tools: {},
      readFile: async () => FAKE_PROMPT,
    });
    assert.equal(result.terminated_reason, "end_turn");
  });
});

describe("runInvestigation: budget caps", () => {
  it("aborts with cost_cap when the cumulative cost exceeds the limit", async () => {
    // 100 input + 10000 output tokens at default sonnet rates = 0.00030 + 0.15 = ~0.15 per call
    const expensive: MessagesWithToolsResponse = {
      content: [{ type: "text", text: "partial text" }],
      stop_reason: "tool_use",
      usage: { input_tokens: 100_000, output_tokens: 100_000 },
      model: "claude-sonnet-4-6",
    };
    const { client } = mockClient([expensive]);
    const result = await runInvestigation(baseInput(), {
      client,
      model: "claude-sonnet-4-6",
      tools: { fetch_url: async () => "" },
      limits: { maxCostUsd: 0.5 },
      readFile: async () => FAKE_PROMPT,
    });
    assert.equal(result.terminated_reason, "cost_cap");
    assert.ok(result.cost_usd >= 0.5);
  });

  it("aborts with tool_cap when tool_calls hits the cap", async () => {
    const { client } = mockClient([
      toolResp("fetch_url", { url: "https://krebsonsecurity.com/1" }),
      toolResp("fetch_url", { url: "https://krebsonsecurity.com/2" }),
      textResp(FINAL_MARKDOWN),
    ]);
    const result = await runInvestigation(baseInput(), {
      client,
      model: "claude-sonnet-4-6",
      tools: { fetch_url: async () => "ok" },
      limits: { maxToolCalls: 1 },
      readFile: async () => FAKE_PROMPT,
    });
    assert.equal(result.terminated_reason, "tool_cap");
    assert.equal(result.tool_calls, 1);
  });

  it("aborts with time_cap when wall-clock is exceeded", async () => {
    let t = 0;
    const { client } = mockClient([
      toolResp("fetch_url", { url: "https://krebsonsecurity.com/x" }),
      textResp(FINAL_MARKDOWN),
    ]);
    const result = await runInvestigation(baseInput(), {
      client,
      model: "claude-sonnet-4-6",
      tools: { fetch_url: async () => "ok" },
      limits: { maxWallClockMs: 100 },
      now: () => {
        t += 500;
        return t;
      },
      readFile: async () => FAKE_PROMPT,
    });
    assert.equal(result.terminated_reason, "time_cap");
  });
});

describe("parseFinalOutput", () => {
  it("returns defaults when no footer present", () => {
    const out = parseFinalOutput("## Summary\nplain body");
    assert.equal(out.confidence_overall, "low");
    assert.equal(out.sources_fetched, 0);
    assert.equal(out.markdown, "## Summary\nplain body");
  });

  it("parses evidence lines tolerant of en-dash vs hyphen separators", () => {
    const md = `## Sources
[1] Krebs - Story Title - https://krebsonsecurity.com/x - accessed: 2026-04-23 - published: 2026-03-11 - tier: tier_1`;
    const out = parseFinalOutput(md);
    assert.equal(out.evidence.length, 1);
    assert.equal(out.evidence[0]!.url, "https://krebsonsecurity.com/x");
    assert.equal(out.evidence[0]!.tier, "tier_1");
    assert.equal(out.evidence[0]!.fetched_at, "2026-04-23");
  });

  it("strips the trailing ```json footer from markdown but keeps the confidence", () => {
    const md = "Body body body.\n\n```json\n{\"confidence_overall\": \"medium\", \"sources_fetched\": 4}\n```";
    const out = parseFinalOutput(md);
    assert.equal(out.confidence_overall, "medium");
    assert.equal(out.sources_fetched, 4);
    assert.ok(!out.markdown.includes("```json"), "footer removed");
  });

  it("unknown tier falls back to 'other'", () => {
    const md = `## Sources
[1] foo - bar - https://unknown.example/x - accessed: 2026-04-23 - published: 2026-03-11 - tier: mystery`;
    const out = parseFinalOutput(md);
    assert.equal(out.evidence[0]!.tier, "other");
  });
});
