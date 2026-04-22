# cyber-news

Personal cybersecurity news dissector. See [`docs/PRD.md`](docs/PRD.md) for the full
design and [`docs/research-notes.md`](docs/research-notes.md) for the research that
shaped it. Hand-maintained entity knowledge base in
[`entities.yaml`](entities.yaml). Repo-level agent instructions in
[`CLAUDE.md`](CLAUDE.md).

## Status

**Phase 1 — ingest + dedup + pre-filter.** No LLM stages. No Discord posting.
PRD §14 phase numbering.

## Layout

```
src/
  ingest/        RSS fetch, URL canonicalization, dedup, ingest run loop
  pipeline/      Deterministic pre-filter (PRD §8.3)
  turso/         libSQL client + articles repository
  entities/      entities.yaml loader
  util/          Shared helpers (rapidfuzz-style title similarity)
migrations/      SQL migrations (libSQL / Turso compatible)
scripts/         Ops scripts (migrate)
tests/           node:test fixture tests
.github/workflows/ingest.yml   Cron every 30 min
```

## Local dev

```bash
npm install
TURSO_DATABASE_URL="file:./local.db" npm run migrate
TURSO_DATABASE_URL="file:./local.db" npm run ingest
npm test
npm run typecheck
```

In CI / Turso, set `TURSO_DATABASE_URL=libsql://...` plus `TURSO_AUTH_TOKEN`.

## Invariants (see CLAUDE.md)

- `entities.yaml` is hand-maintained. Never auto-update.
- One PRD phase per PR.
- Schema changes require a new file in `migrations/`.
- Errors are logged with `stage_reached`; never silently swallowed.
