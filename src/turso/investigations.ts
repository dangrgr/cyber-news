// Investigations repository — Phase 3.
// One row per investigation run. `requested_at` is stamped on start; the rest
// is back-filled when the orchestrator returns. Draft markdown is the full
// report body per PRD §10.4; evidence_json is the parsed Sources section
// (url, tier, fetched_at, snippet).

import type { Client } from "@libsql/client";
import type { EvidenceEntry, InvestigationResult } from "../investigate/types.ts";

export interface InvestigationRow {
  id: string;
  incident_id: string;
  requested_at: string;
  completed_at: string | null;
  model_used: string | null;
  draft_markdown: string | null;
  evidence_json: string | null;
  cost_usd: number | null;
}

export async function insertInvestigation(
  client: Client,
  id: string,
  incidentId: string,
): Promise<void> {
  await client.execute({
    sql: `INSERT INTO investigations (id, incident_id, requested_at)
          VALUES (?, ?, ?)
          ON CONFLICT(id) DO NOTHING`,
    args: [id, incidentId, new Date().toISOString()],
  });
}

export async function setInvestigationComplete(
  client: Client,
  id: string,
  result: InvestigationResult,
): Promise<void> {
  await client.execute({
    sql: `UPDATE investigations
             SET completed_at = ?, model_used = ?, draft_markdown = ?,
                 evidence_json = ?, cost_usd = ?
           WHERE id = ?`,
    args: [
      new Date().toISOString(),
      result.model,
      result.markdown,
      JSON.stringify(result.evidence),
      result.cost_usd,
      id,
    ],
  });
}

export async function getInvestigation(
  client: Client,
  id: string,
): Promise<InvestigationRow | null> {
  const res = await client.execute({ sql: `SELECT * FROM investigations WHERE id = ?`, args: [id] });
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    incident_id: String(row.incident_id),
    requested_at: String(row.requested_at),
    completed_at: row.completed_at == null ? null : String(row.completed_at),
    model_used: row.model_used == null ? null : String(row.model_used),
    draft_markdown: row.draft_markdown == null ? null : String(row.draft_markdown),
    evidence_json: row.evidence_json == null ? null : String(row.evidence_json),
    cost_usd: row.cost_usd == null ? null : Number(row.cost_usd),
  };
}

export function parseEvidenceJson(json: string | null): EvidenceEntry[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as EvidenceEntry[]) : [];
  } catch {
    return [];
  }
}
