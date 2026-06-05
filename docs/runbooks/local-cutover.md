# Runbook — Turso → local cutover (issue #41)

Cutting the Hermes local runtime over to a file-backed SQLite (PR #42) without
first copying the existing Turso data is **not safe**. Dedup and publish-gating
live entirely in the DB, so an empty local DB makes every still-in-feed article
look brand-new: it gets re-ingested, re-processed, **re-published to Discord**,
and the `articles` / `incidents` history + audit trail is lost.

This runbook seeds the local DB from Turso first, verifies it, dry-runs the
pipeline, then goes live.

> The seed itself is a **human action**: it needs the real Turso credentials and
> the `/home/dan/apps/cyber-news` app home, neither of which exists in CI.

## Prerequisites

- PR #42 (local runtime plumbing) merged or checked out locally.
- Remote Turso URL + auth token (the values previously used as
  `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` in GitHub Actions).
- App home created (PR #42's `local_run.sh` creates it; or `mkdir -p`).

## Steps

### 1. Create + migrate the local DB (schema only)

```bash
export TURSO_DATABASE_URL=file:/home/dan/apps/cyber-news/state/cyber-news.db
export TURSO_AUTH_TOKEN=
npm run migrate
```

### 2. Dry-run the seed (no writes)

`TURSO_SOURCE_*` is the **remote** DB to copy FROM. The destination is the local
`file:` DB from step 1 (`LOCAL_DB_URL`, falling back to `TURSO_DATABASE_URL`).

```bash
export TURSO_SOURCE_URL=libsql://<your-db>.turso.io
export TURSO_SOURCE_AUTH_TOKEN=<remote-token>
export LOCAL_DB_URL=file:/home/dan/apps/cyber-news/state/cyber-news.db

DRY_RUN=1 npm run seed:local
```

Confirm the reported `source_rows` for `articles` and `incidents` look right.

### 3. Seed for real

```bash
npm run seed:local
```

The script:

- **refuses if the local `articles`/`incidents` already have rows** (one-shot, not a merge);
- refuses to write anywhere that isn't a local `file:` URL;
- copies `articles`, `incidents` (core) and `entity_aliases`, `cve_cache`,
  `investigations` (regenerable — skipped if the dest already has them);
- verifies copied row counts match the source and exits non-zero on mismatch.

### 4. Verify

```bash
sqlite3 /home/dan/apps/cyber-news/state/cyber-news.db \
  "SELECT 'articles', COUNT(*) FROM articles UNION ALL SELECT 'incidents', COUNT(*) FROM incidents;"
```

Counts should match the seed report / source.

### 5. Dry-run the pipeline before publishing

The local wrapper points at a real Discord webhook and does not set `DRY_RUN`.
Confirm the seeded DB dedups correctly (i.e. the pipeline does **not** want to
re-publish the backlog) before going live:

```bash
DRY_RUN=1 npm run process   # short-circuits the Discord POST at the HTTP chokepoint
```

Inspect the `discord_payload` events in the run log. Expect few/none — anything
already published should be deduped, not re-sent.

### 6. Go live

Enable the Hermes `cyber-news-ingest-local` / `cyber-news-process-local` jobs
(or run `npm run local:ingest` / `npm run local:process`). Keep the GitHub
`workflow_dispatch` fallback per #41.

## Rollback

Per the #41 decision, the **reverse** sync (local → Turso) is an accepted data
gap — design a custom sync-back at that time if rollback is needed. The forward
seed in this runbook is what prevents the duplicate-publish storm on cutover.
