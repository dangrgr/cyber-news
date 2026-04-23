// Incidents repository — Phase 2.
// The co-mention-guard split from PRD §10.2 is preserved through persistence:
// victim_orgs_confirmed vs orgs_mentioned (and the same for actors).
// Legacy `victim_orgs` / `threat_actors` are populated as the union for
// backward compat; new code should prefer the split fields.

import type { Client } from "@libsql/client";
import type { Confidence } from "../patterns/types.ts";

export interface IncidentRow {
  id: string;
  first_seen_at: string;
  last_updated_at: string;
  title: string;
  summary: string;
  incident_date: string | null;
  confidence: Confidence;
  victim_orgs_confirmed: string[];
  orgs_mentioned: string[];
  threat_actors_attributed: string[];
  actors_mentioned: string[];
  cves: string[];
  initial_access_vector: string | null;
  ttps: string[];
  impact_json: string | null;
  campaign_tags: string[];
  claim_markers_observed: string[];
  primary_source: string | null;
  corroboration_count: number;
  corroboration_tier1: number;
  corroboration_tier2: number;
  source_urls: string[];
  discord_message_id: string | null;
  investigation_status: "none" | "pending" | "complete";
}

export interface InsertIncident {
  id: string;
  title: string;
  summary: string;
  incidentDate: string | null;
  confidence: Confidence;
  victimOrgsConfirmed: string[];
  orgsMentioned: string[];
  threatActorsAttributed: string[];
  actorsMentioned: string[];
  cves: string[];
  initialAccessVector: string | null;
  ttps: string[];
  impactJson: string | null;
  campaignTags?: string[];
  claimMarkersObserved: string[];
  primarySource: string | null;
  sourceUrls: string[];
}

const INSERT_SQL = `
  INSERT INTO incidents (
    id, first_seen_at, last_updated_at, title, summary, incident_date, confidence,
    victim_orgs, threat_actors, cves, initial_access_vector, ttps, impact_json,
    campaign_tags, corroboration_count, source_urls, investigation_status,
    victim_orgs_confirmed, orgs_mentioned, threat_actors_attributed,
    actors_mentioned, claim_markers_observed, primary_source,
    corroboration_tier1, corroboration_tier2
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, 'none',
    ?, ?, ?,
    ?, ?, ?,
    0, 0
  )
  ON CONFLICT(id) DO NOTHING
`;

export async function insertIncident(client: Client, i: InsertIncident): Promise<boolean> {
  const now = new Date().toISOString();
  const victimUnion = unique([...i.victimOrgsConfirmed, ...i.orgsMentioned]);
  const actorUnion = unique([...i.threatActorsAttributed, ...i.actorsMentioned]);
  const res = await client.execute({
    sql: INSERT_SQL,
    args: [
      i.id, now, now, i.title, i.summary, i.incidentDate, i.confidence,
      JSON.stringify(victimUnion),
      JSON.stringify(actorUnion),
      JSON.stringify(i.cves),
      i.initialAccessVector,
      JSON.stringify(i.ttps),
      i.impactJson,
      JSON.stringify(i.campaignTags ?? []),
      1, // corroboration_count starts at 1 source
      JSON.stringify(i.sourceUrls),
      JSON.stringify(i.victimOrgsConfirmed),
      JSON.stringify(i.orgsMentioned),
      JSON.stringify(i.threatActorsAttributed),
      JSON.stringify(i.actorsMentioned),
      JSON.stringify(i.claimMarkersObserved),
      i.primarySource,
    ],
  });
  return res.rowsAffected > 0;
}

export async function getIncident(client: Client, id: string): Promise<IncidentRow | null> {
  const res = await client.execute({ sql: `SELECT * FROM incidents WHERE id = ?`, args: [id] });
  const row = res.rows[0];
  return row ? rowToIncident(row) : null;
}

/** Record an additional source joining an existing incident. Updates corroboration + last_updated_at. */
export async function addSourceToIncident(
  client: Client,
  incidentId: string,
  newSourceUrl: string,
): Promise<void> {
  const existing = await getIncident(client, incidentId);
  if (!existing) throw new Error(`incident not found: ${incidentId}`);
  if (existing.source_urls.includes(newSourceUrl)) return;
  const updated = [...existing.source_urls, newSourceUrl];
  await client.execute({
    sql: `UPDATE incidents
            SET source_urls = ?, corroboration_count = ?, last_updated_at = ?
          WHERE id = ?`,
    args: [JSON.stringify(updated), updated.length, new Date().toISOString(), incidentId],
  });
}

export async function setDiscordMessageId(client: Client, incidentId: string, messageId: string): Promise<void> {
  await client.execute({
    sql: `UPDATE incidents SET discord_message_id = ? WHERE id = ?`,
    args: [messageId, incidentId],
  });
}

export async function setCorroborationCounts(
  client: Client,
  incidentId: string,
  tier1: number,
  tier2: number,
): Promise<void> {
  await client.execute({
    sql: `UPDATE incidents SET corroboration_tier1 = ?, corroboration_tier2 = ?, last_updated_at = ? WHERE id = ?`,
    args: [tier1, tier2, new Date().toISOString(), incidentId],
  });
}

function rowToIncident(row: Record<string, unknown>): IncidentRow {
  return {
    id: String(row.id),
    first_seen_at: String(row.first_seen_at),
    last_updated_at: String(row.last_updated_at),
    title: String(row.title),
    summary: String(row.summary),
    incident_date: row.incident_date == null ? null : String(row.incident_date),
    confidence: String(row.confidence) as Confidence,
    victim_orgs_confirmed: parseJsonArray(row.victim_orgs_confirmed),
    orgs_mentioned: parseJsonArray(row.orgs_mentioned),
    threat_actors_attributed: parseJsonArray(row.threat_actors_attributed),
    actors_mentioned: parseJsonArray(row.actors_mentioned),
    cves: parseJsonArray(row.cves),
    initial_access_vector: row.initial_access_vector == null ? null : String(row.initial_access_vector),
    ttps: parseJsonArray(row.ttps),
    impact_json: row.impact_json == null ? null : String(row.impact_json),
    campaign_tags: parseJsonArray(row.campaign_tags),
    claim_markers_observed: parseJsonArray(row.claim_markers_observed),
    primary_source: row.primary_source == null ? null : String(row.primary_source),
    corroboration_count: Number(row.corroboration_count),
    corroboration_tier1: Number(row.corroboration_tier1 ?? 0),
    corroboration_tier2: Number(row.corroboration_tier2 ?? 0),
    source_urls: parseJsonArray(row.source_urls),
    discord_message_id: row.discord_message_id == null ? null : String(row.discord_message_id),
    investigation_status: String(row.investigation_status) as IncidentRow["investigation_status"],
  };
}

function parseJsonArray(v: unknown): string[] {
  if (v == null) return [];
  try {
    const parsed = JSON.parse(String(v));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function unique(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}
