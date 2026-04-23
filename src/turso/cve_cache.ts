// CVE cache — read-through cache over NVD. Stores positive and negative lookups
// so repeated hallucinated CVE IDs don't re-hit NVD on every run. See PRD §7.2.

import type { Client } from "@libsql/client";

export interface CveRow {
  cve_id: string;
  exists: boolean;
  cvss_v31: number | null;
  severity: string | null;
  summary: string | null;
  kev_listed: boolean;
  fetched_at: string;
  raw_json: string | null;
}

export interface UpsertCveInput {
  cveId: string; // caller is expected to pass already-normalized uppercase
  exists: boolean;
  cvssV31?: number | null;
  severity?: string | null;
  summary?: string | null;
  kevListed?: boolean;
  rawJson?: string | null;
}

export async function getCached(client: Client, cveId: string): Promise<CveRow | null> {
  const res = await client.execute({
    sql: `SELECT cve_id, exists_flag, cvss_v31, severity, summary, kev_listed, fetched_at, raw_json
            FROM cve_cache WHERE cve_id = ?`,
    args: [cveId],
  });
  const row = res.rows[0];
  if (!row) return null;
  return {
    cve_id: String(row.cve_id),
    exists: Number(row.exists_flag) === 1,
    cvss_v31: row.cvss_v31 == null ? null : Number(row.cvss_v31),
    severity: row.severity == null ? null : String(row.severity),
    summary: row.summary == null ? null : String(row.summary),
    kev_listed: Number(row.kev_listed ?? 0) === 1,
    fetched_at: String(row.fetched_at),
    raw_json: row.raw_json == null ? null : String(row.raw_json),
  };
}

export async function upsertCached(
  client: Client,
  input: UpsertCveInput,
  now: () => Date = () => new Date(),
): Promise<void> {
  await client.execute({
    sql: `INSERT INTO cve_cache
            (cve_id, exists_flag, cvss_v31, severity, summary, kev_listed, fetched_at, raw_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(cve_id) DO UPDATE SET
            exists_flag = excluded.exists_flag,
            cvss_v31    = excluded.cvss_v31,
            severity    = excluded.severity,
            summary     = excluded.summary,
            kev_listed  = excluded.kev_listed,
            fetched_at  = excluded.fetched_at,
            raw_json    = excluded.raw_json`,
    args: [
      input.cveId,
      input.exists ? 1 : 0,
      input.cvssV31 ?? null,
      input.severity ?? null,
      input.summary ?? null,
      input.kevListed ? 1 : 0,
      now().toISOString(),
      input.rawJson ?? null,
    ],
  });
}

/** Returns true iff the row's fetched_at is within ttlDays of now. */
export function isFresh(row: CveRow, ttlDays: number, now: Date = new Date()): boolean {
  const fetched = Date.parse(row.fetched_at);
  if (Number.isNaN(fetched)) return false;
  const ageMs = now.getTime() - fetched;
  return ageMs >= 0 && ageMs <= ttlDays * 24 * 60 * 60 * 1000;
}
