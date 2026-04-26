// Given an IncidentRow + its source-zero ArticleRow, rebuild an ExtractionOutput
// object to feed back to the investigation agent as part of its input payload.
// The incidents table stores the extraction's fields split across columns
// (co-mention guard, impact_json blob, etc.); this function reverses the split.
//
// If a field was lost or was always null, we use null / empty array — the
// investigation agent treats the payload as "what Phase 2 learned about this
// incident," not as ground truth.

import type { IncidentRow } from "../turso/incidents.ts";
import type { ExtractionImpact, ExtractionOutput } from "../patterns/types.ts";

const EMPTY_IMPACT: ExtractionImpact = {
  affected_count: null,
  affected_count_unit: null,
  data_exfil_size: null,
  sector: null,
  geographic_scope: null,
  service_disruption: null,
};

export function reconstructExtraction(incident: IncidentRow): ExtractionOutput {
  return {
    title: incident.title,
    summary: incident.summary,
    victim_orgs_confirmed: incident.victim_orgs_confirmed,
    orgs_mentioned: incident.orgs_mentioned,
    threat_actors_attributed: incident.threat_actors_attributed,
    actors_mentioned: incident.actors_mentioned,
    cves: incident.cves,
    initial_access_vector: incident.initial_access_vector,
    ttps: incident.ttps,
    impact: parseImpact(incident.impact_json),
    incident_date: incident.incident_date,
    confidence: incident.confidence,
    claim_markers_observed: incident.claim_markers_observed,
    primary_source: (incident.primary_source as ExtractionOutput["primary_source"]) ?? "article_itself",
  };
}

function parseImpact(json: string | null): ExtractionImpact {
  if (!json) return { ...EMPTY_IMPACT };
  try {
    const parsed = JSON.parse(json) as Partial<ExtractionImpact>;
    return {
      affected_count: toNumberOrNull(parsed.affected_count),
      affected_count_unit: toStringOrNull(parsed.affected_count_unit),
      data_exfil_size: toStringOrNull(parsed.data_exfil_size),
      sector: toStringOrNull(parsed.sector),
      geographic_scope: toStringOrNull(parsed.geographic_scope),
      service_disruption: toStringOrNull(parsed.service_disruption),
    };
  } catch {
    return { ...EMPTY_IMPACT };
  }
}

function toNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function toStringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
