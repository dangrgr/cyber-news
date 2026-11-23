CREATE TABLE IF NOT EXISTS publication_retry (
  article_id TEXT PRIMARY KEY,
  retry_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS pending_discord_posts (
  incident_id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL
);
