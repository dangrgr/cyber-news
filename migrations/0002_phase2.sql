-- Phase 2 schema. Supports triage → extract → factcheck → Discord.
-- Mirrors PRD §6 with the co-mention-guard split from §10.2 preserved in storage.

-- Incidents: widen to preserve victim_orgs_confirmed vs orgs_mentioned (and the
-- same split for threat actors). The Phase 1 victim_orgs / threat_actors columns
-- stay as denormalized union-of-both for backward compatibility.
ALTER TABLE incidents ADD COLUMN victim_orgs_confirmed    TEXT NOT NULL DEFAULT '[]';
ALTER TABLE incidents ADD COLUMN orgs_mentioned           TEXT NOT NULL DEFAULT '[]';
ALTER TABLE incidents ADD COLUMN threat_actors_attributed TEXT NOT NULL DEFAULT '[]';
ALTER TABLE incidents ADD COLUMN actors_mentioned         TEXT NOT NULL DEFAULT '[]';
ALTER TABLE incidents ADD COLUMN claim_markers_observed   TEXT NOT NULL DEFAULT '[]';
ALTER TABLE incidents ADD COLUMN primary_source           TEXT;
ALTER TABLE incidents ADD COLUMN corroboration_tier1      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE incidents ADD COLUMN corroboration_tier2      INTEGER NOT NULL DEFAULT 0;

-- NVD cache. Read-through, 14-day TTL applied in app code. Both positive and
-- negative results are cached (exists_flag = 0 for CVEs NVD doesn't know about)
-- so repeated hallucinated CVE IDs don't hammer NVD every run.
CREATE TABLE IF NOT EXISTS cve_cache (
  cve_id      TEXT PRIMARY KEY,           -- normalized uppercase CVE-YYYY-NNNN+
  exists_flag INTEGER NOT NULL,           -- 0 = not found on NVD, 1 = found
  cvss_v31    REAL,
  severity    TEXT,                       -- NONE | LOW | MEDIUM | HIGH | CRITICAL
  summary     TEXT,
  kev_listed  INTEGER NOT NULL DEFAULT 0, -- 0 = not yet checked or not listed
  fetched_at  TEXT NOT NULL,              -- ISO 8601
  raw_json    TEXT                        -- full NVD payload for Phase 3 reuse
);

CREATE INDEX IF NOT EXISTS idx_cve_cache_fetched ON cve_cache(fetched_at DESC);
