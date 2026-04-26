// The agentic loop. Reads the `patterns/investigate/pattern.md` system prompt,
// drives messages.create with tool use until end_turn or a budget cap, parses
// the final markdown + sources + JSON footer, and returns InvestigationResult.
//
// Budget caps (PRD §11.3 limits): cost_usd, tool_calls, wall-clock. Any cap
// triggers graceful abort — we stop the loop, accept the last assistant text
// (even if mid-phase), and return `terminated_reason` so the caller can mark
// the run as partial in Discord.

import { readFile as fsReadFile } from "node:fs/promises";

import type {
  MessagesWithToolsClient,
  MessagesWithToolsParams,
  MessagesWithToolsResponse,
  Message,
  ToolResultBlock,
  ToolUseBlock,
} from "../clients/anthropic_tools.ts";
import { renderTemplate } from "../patterns/template.ts";
import {
  DEFAULT_INVESTIGATION_LIMITS,
  type EvidenceEntry,
  type EvidenceTier,
  type InvestigationInput,
  type InvestigationLimits,
  type InvestigationResult,
  type ConfidenceOverall,
} from "./types.ts";
import { INVESTIGATION_TOOLS, type ToolRegistry } from "./tools.ts";

export interface OrchestratorDeps {
  client: MessagesWithToolsClient;
  model: string;
  tools: ToolRegistry;
  limits?: Partial<InvestigationLimits>;
  patternsRoot?: string;
  readFile?: (path: string) => Promise<string>;
  now?: () => number;
  costRates?: CostRates;
  maxOutputTokens?: number;
}

export interface CostRates {
  inputPerMillion: number;
  outputPerMillion: number;
}

// claude-sonnet-4-6 pricing (USD / 1M tokens) as of this writing.
// If the model env var points elsewhere, pass costRates explicitly.
export const DEFAULT_SONNET_RATES: CostRates = {
  inputPerMillion: 3,
  outputPerMillion: 15,
};

const MAX_AGENTIC_ITERATIONS = 30;

export async function runInvestigation(
  input: InvestigationInput,
  deps: OrchestratorDeps,
): Promise<InvestigationResult> {
  const limits: InvestigationLimits = {
    ...DEFAULT_INVESTIGATION_LIMITS,
    ...(deps.limits ?? {}),
  };
  const rates = deps.costRates ?? DEFAULT_SONNET_RATES;
  const readFile = deps.readFile ?? ((p: string) => fsReadFile(p, "utf-8"));
  const now = deps.now ?? (() => Date.now());
  const patternsRoot = deps.patternsRoot ?? "patterns";
  const maxOutputTokens = deps.maxOutputTokens ?? 8192;

  const promptTemplate = await readFile(`${patternsRoot}/investigate/pattern.md`);
  const system = renderTemplate(promptTemplate, buildPlaceholders(input));

  const messages: Message[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text:
            "Begin the investigation. Announce each phase and follow the five-phase algorithm.",
        },
      ],
    },
  ];

  const startedAt = now();
  let costUsd = 0;
  let toolCalls = 0;
  const errors: string[] = [];
  let lastText = "";
  let iteration = 0;
  let terminated: InvestigationResult["terminated_reason"] = "error";

  while (iteration < MAX_AGENTIC_ITERATIONS) {
    iteration++;

    const params: MessagesWithToolsParams = {
      model: deps.model,
      system,
      messages,
      tools: INVESTIGATION_TOOLS,
      max_tokens: maxOutputTokens,
      temperature: 0,
    };

    let resp: MessagesWithToolsResponse;
    try {
      resp = await deps.client.create(params);
    } catch (e) {
      errors.push(`api_call_failed: ${errMsg(e)}`);
      terminated = "error";
      break;
    }

    costUsd += computeCost(resp, rates);
    lastText = accumulateText(resp, lastText);

    if (costUsd >= limits.maxCostUsd) {
      terminated = "cost_cap";
      break;
    }
    if (now() - startedAt >= limits.maxWallClockMs) {
      terminated = "time_cap";
      break;
    }

    if (resp.stop_reason !== "tool_use") {
      terminated = resp.stop_reason === "end_turn" ? "end_turn" : "error";
      if (resp.stop_reason !== "end_turn") {
        errors.push(`unexpected_stop_reason: ${resp.stop_reason}`);
      }
      break;
    }

    messages.push({ role: "assistant", content: resp.content });

    const toolUseBlocks = resp.content.filter(
      (b): b is ToolUseBlock => b.type === "tool_use",
    );

    const toolResults: ToolResultBlock[] = [];
    for (const block of toolUseBlocks) {
      toolCalls++;
      if (toolCalls > limits.maxToolCalls) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify({ error: "tool_cap_exceeded" }),
          is_error: true,
        });
        continue;
      }
      const runner = deps.tools[block.name];
      if (!runner) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify({ error: "unknown_tool", name: block.name }),
          is_error: true,
        });
        continue;
      }
      try {
        const result = await runner(block.input);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      } catch (e) {
        const msg = errMsg(e);
        errors.push(`tool_${block.name}: ${msg}`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify({ error: "tool_raised", message: msg }),
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });

    if (toolCalls >= limits.maxToolCalls) {
      terminated = "tool_cap";
      break;
    }
  }

  if (iteration >= MAX_AGENTIC_ITERATIONS && terminated === "error") {
    errors.push("max_agentic_iterations_reached");
  }

  const parsed = parseFinalOutput(lastText);

  return {
    incident_id: input.incident.id,
    model: deps.model,
    markdown: parsed.markdown,
    evidence: parsed.evidence,
    confidence_overall: parsed.confidence_overall,
    sources_fetched: parsed.sources_fetched,
    cost_usd: round2(costUsd),
    tool_calls: toolCalls,
    terminated_reason: terminated,
    errors,
  };
}

// ----- helpers -----

function buildPlaceholders(input: InvestigationInput): Record<string, string> {
  const { incident, sourceZero, relatedIncidents } = input;
  const related = relatedIncidents.length
    ? relatedIncidents
        .map(
          (r) =>
            `- ${r.id} | ${r.incident_date ?? "?"} | ${r.title} | shared_actors=${r.shared_actors.join(",")} shared_cves=${r.shared_cves.join(",")}`,
        )
        .join("\n")
    : "(no related incidents found)";
  return {
    incident_id: incident.id,
    incident_title: incident.title,
    incident_confidence: incident.confidence,
    source_zero_url: sourceZero.url,
    source_zero_published_at: sourceZero.published_at,
    source_zero_source: sourceZero.source_id,
    source_zero_raw_text: sourceZero.raw_text,
    extraction_json: JSON.stringify(
      {
        title: incident.title,
        summary: incident.summary,
        victim_orgs_confirmed: incident.victim_orgs_confirmed,
        orgs_mentioned: incident.orgs_mentioned,
        threat_actors_attributed: incident.threat_actors_attributed,
        actors_mentioned: incident.actors_mentioned,
        cves: incident.cves,
        initial_access_vector: incident.initial_access_vector,
        ttps: incident.ttps,
        incident_date: incident.incident_date,
        confidence: incident.confidence,
        claim_markers_observed: incident.claim_markers_observed,
        primary_source: incident.primary_source,
      },
      null,
      2,
    ),
    related_incidents_block: related,
  };
}

function accumulateText(resp: MessagesWithToolsResponse, prior: string): string {
  const text = resp.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text.trim().length > 0 ? text : prior;
}

function computeCost(resp: MessagesWithToolsResponse, rates: CostRates): number {
  const ins = resp.usage.input_tokens / 1_000_000;
  const outs = resp.usage.output_tokens / 1_000_000;
  return ins * rates.inputPerMillion + outs * rates.outputPerMillion;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ----- parsing the final output -----

interface ParsedOutput {
  markdown: string;
  evidence: EvidenceEntry[];
  confidence_overall: ConfidenceOverall;
  sources_fetched: number;
}

const FOOTER_REGEX =
  /```json\s*(\{[^`]*?"confidence_overall"[^`]*?\})\s*```\s*$/;

export function parseFinalOutput(text: string): ParsedOutput {
  const trimmed = text.trim();
  const footerMatch = FOOTER_REGEX.exec(trimmed);

  let confidence_overall: ConfidenceOverall = "low";
  let sources_fetched = 0;
  let markdownEnd = trimmed.length;
  if (footerMatch) {
    markdownEnd = footerMatch.index;
    try {
      const footer = JSON.parse(footerMatch[1]!) as {
        confidence_overall?: string;
        sources_fetched?: number;
      };
      if (
        footer.confidence_overall === "high" ||
        footer.confidence_overall === "medium" ||
        footer.confidence_overall === "low"
      ) {
        confidence_overall = footer.confidence_overall;
      }
      if (typeof footer.sources_fetched === "number") {
        sources_fetched = footer.sources_fetched;
      }
    } catch {
      // ignore — leave defaults
    }
  }

  const markdown = trimmed.slice(0, markdownEnd).trim();
  const evidence = parseSourcesSection(markdown);
  if (sources_fetched === 0) sources_fetched = evidence.length;

  return { markdown, evidence, confidence_overall, sources_fetched };
}

const EVIDENCE_TIERS: ReadonlyArray<EvidenceTier> = [
  "tier_1",
  "tier_2",
  "vendor_authoritative",
  "gov_advisory",
  "victim_statement",
  "other",
];

function parseSourcesSection(markdown: string): EvidenceEntry[] {
  const sourcesIdx = markdown.search(/^##+\s+Sources\s*$/m);
  if (sourcesIdx < 0) return [];
  const body = markdown.slice(sourcesIdx);
  const lines = body.split(/\r?\n/).slice(1);
  const entries: EvidenceEntry[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) continue;
    if (/^##+\s/.test(line)) break;
    const match = /^\[(\d+)\]\s*(.*)$/.exec(line);
    if (!match) continue;
    const n = Number(match[1]);
    const rest = match[2]!;
    entries.push(parseEvidenceLine(n, rest));
  }
  return entries;
}

function parseEvidenceLine(n: number, rest: string): EvidenceEntry {
  const parts = rest.split(/\s+(?:—|–|-)\s+/g).map((s) => s.trim());
  const urlPart = parts.find((p) => /^https?:\/\//.test(p)) ?? null;
  const titlePart =
    parts.find((p) => p !== urlPart && !/^(accessed|published|tier)\s*:/i.test(p)) ?? null;
  const fetched = findKv(parts, "accessed");
  const published = findKv(parts, "published");
  const tierRaw = findKv(parts, "tier");
  const tier: EvidenceTier = EVIDENCE_TIERS.includes(tierRaw as EvidenceTier)
    ? (tierRaw as EvidenceTier)
    : "other";
  return {
    n,
    url: urlPart ?? "",
    title: titlePart ?? null,
    tier,
    fetched_at: fetched,
    source_published_at: published,
    snippet: null,
  };
}

function findKv(parts: string[], key: string): string | null {
  const match = parts.find((p) => new RegExp(`^${key}\\s*:`, "i").test(p));
  if (!match) return null;
  const value = match.replace(new RegExp(`^${key}\\s*:\\s*`, "i"), "").trim();
  return value.length > 0 ? value : null;
}
