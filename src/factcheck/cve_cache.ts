// Read-through CVE cache. Reads from the Turso cve_cache table; on miss or
// stale, calls NVD and persists the result (positive or negative).

import type { Client } from "@libsql/client";
import { getCached, isFresh, upsertCached, type CveRow } from "../turso/cve_cache.ts";
import type { NvdClient } from "../clients/nvd.ts";

export interface CveCacheDeps {
  client: Client;
  nvd: NvdClient;
  ttlDays?: number;
  now?: () => Date;
}

/** Normalizes a CVE id to uppercase, trimmed. Returns null if the id doesn't match the CVE-YYYY-NNNN+ pattern. */
export function normalizeCveId(id: string): string | null {
  const trimmed = id.trim().toUpperCase();
  return /^CVE-\d{4}-\d{4,}$/.test(trimmed) ? trimmed : null;
}

/**
 * Resolves a CVE: returns the cached row if fresh, otherwise calls NVD and
 * writes the result. Negative results (NVD doesn't know the CVE) are cached
 * so hallucinated ids don't trigger a network call every run.
 */
export async function lookupCve(cveId: string, deps: CveCacheDeps): Promise<CveRow> {
  const normalized = normalizeCveId(cveId);
  const ttl = deps.ttlDays ?? 14;
  const now = deps.now ?? (() => new Date());
  if (!normalized) {
    // Malformed ids aren't cached — the caller's deterministic check handles them.
    return {
      cve_id: cveId.trim().toUpperCase(),
      exists: false,
      cvss_v31: null,
      severity: null,
      summary: null,
      kev_listed: false,
      fetched_at: now().toISOString(),
      raw_json: null,
    };
  }

  const cached = await getCached(deps.client, normalized);
  if (cached && isFresh(cached, ttl, now())) return cached;

  const result = await deps.nvd.lookup(normalized);
  await upsertCached(deps.client, {
    cveId: normalized,
    exists: result.exists,
    cvssV31: result.cvssV31,
    severity: result.severity,
    summary: result.summary,
    rawJson: result.rawJson,
  }, now);

  return {
    cve_id: normalized,
    exists: result.exists,
    cvss_v31: result.cvssV31,
    severity: result.severity,
    summary: result.summary,
    kev_listed: false,
    fetched_at: now().toISOString(),
    raw_json: result.rawJson,
  };
}

/** Convenience: boolean existence check wrapped around lookupCve, for deterministic checks. */
export async function cveExists(cveId: string, deps: CveCacheDeps): Promise<boolean> {
  const row = await lookupCve(cveId, deps);
  return row.exists;
}
