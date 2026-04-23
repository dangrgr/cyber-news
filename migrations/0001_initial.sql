-- Phase 1 schema. Mirrors PRD §6.
-- libSQL (Turso) compatible; runs unchanged on local SQLite via @libsql/client `file:` URL.

CREATE TABLE IF NOT EXISTS articles (
  id              TEXT PRIMARY KEY,        -- sha256(canonical_url)
  source_id       TEXT NOT NULL,           -- e.g., "krebs", "bleepingcomputer"
  url             TEXT NOT NULL UNIQUE,
  canonical_url   TEXT NOT NULL,
  title           TEXT NOT NULL,
  author          TEXT,
  published_at    TEXT NOT NULL,           -- ISO 8601
  ingested_at     TEXT NOT NULL,
  raw_text        TEXT NOT NULL,
  stage_reached   TEXT NOT NULL,           -- deduped | pre_filtered | triage_rejected
                                           -- extracted | factcheck_failed | published
  failure_reason  TEXT,
  incident_id     TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_stage     ON articles(stage_reached);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_canonical ON articles(canonical_url);

CREATE TABLE IF NOT EXISTS incidents (
  id                    TEXT PRIMARY KEY,
  first_seen_at         TEXT NOT NULL,
  last_updated_at       TEXT NOT NULL,
  title                 TEXT NOT NULL,
  summary               TEXT NOT NULL,
  incident_date         TEXT,
  confidence            TEXT NOT NULL,     -- claim | reported | confirmed
  victim_orgs           TEXT NOT NULL,     -- JSON array
  threat_actors         TEXT NOT NULL,     -- JSON array (canonical names)
  cves                  TEXT NOT NULL,     -- JSON array
  initial_access_vector TEXT,
  ttps                  TEXT,              -- JSON array
  impact_json           TEXT,
  campaign_tags         TEXT,              -- JSON array
  corroboration_count   INTEGER NOT NULL DEFAULT 1,
  source_urls           TEXT NOT NULL,     -- JSON array
  discord_message_id    TEXT,
  investigation_status  TEXT NOT NULL DEFAULT 'none'
);

CREATE INDEX IF NOT EXISTS idx_incidents_date   ON incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_actors ON incidents(threat_actors);

CREATE TABLE IF NOT EXISTS entity_aliases (
  alias        TEXT NOT NULL,
  canonical    TEXT NOT NULL,
  entity_type  TEXT NOT NULL,             -- actor | campaign | org
  confidence   REAL NOT NULL,             -- 1.0 for YAML-defined
  PRIMARY KEY (alias, entity_type)
);

CREATE TABLE IF NOT EXISTS investigations (
  id             TEXT PRIMARY KEY,
  incident_id    TEXT NOT NULL,
  requested_at   TEXT NOT NULL,
  completed_at   TEXT,
  model_used     TEXT,
  draft_markdown TEXT,
  evidence_json  TEXT,
  cost_usd       REAL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id)
);
