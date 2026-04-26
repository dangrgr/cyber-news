// Phase 3 investigation types. The orchestrator produces `InvestigationResult`;
// the CLI entry feeds it through the Discord publisher and the investigations
// repo. Shapes are documented in PRD §10.4 (output contract) and §11.3
// (routine output_schema — we diverge in transport but preserve the semantics).

import type { ArticleRow } from "../turso/articles.ts";
import type { IncidentRow } from "../turso/incidents.ts";

export type EvidenceTier =
  | "tier_1"
  | "tier_2"
  | "vendor_authoritative"
  | "gov_advisory"
  | "victim_statement"
  | "other";

export interface EvidenceEntry {
  n: number;                    // numeric citation key, matches [n] in the body
  url: string;
  title: string | null;
  tier: EvidenceTier;
  fetched_at: string | null;    // ISO 8601, when the agent fetched it
  source_published_at: string | null; // ISO date from the page itself
  snippet: string | null;
}

export type ConfidenceOverall = "high" | "medium" | "low";

export interface InvestigationResult {
  incident_id: string;
  model: string;
  markdown: string;                 // full report body; contains "[n]" citations
  evidence: EvidenceEntry[];
  confidence_overall: ConfidenceOverall;
  sources_fetched: number;
  cost_usd: number;
  tool_calls: number;
  terminated_reason: "end_turn" | "cost_cap" | "tool_cap" | "time_cap" | "error";
  errors: string[];                 // non-fatal errors accumulated during the run
}

export interface InvestigationInput {
  incident: IncidentRow;
  sourceZero: ArticleRow;
  relatedIncidents: ReadonlyArray<{
    id: string;
    title: string;
    incident_date: string | null;
    shared_actors: string[];
    shared_cves: string[];
  }>;
}

export interface InvestigationLimits {
  maxCostUsd: number;       // default 1.50
  maxToolCalls: number;     // default 40
  maxWallClockMs: number;   // default 15 * 60_000
}

export const DEFAULT_INVESTIGATION_LIMITS: InvestigationLimits = {
  maxCostUsd: 1.5,
  maxToolCalls: 40,
  maxWallClockMs: 15 * 60_000,
};
