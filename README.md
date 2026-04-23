# cyber-news

Personal cybersecurity news dissector. See [`docs/PRD.md`](docs/PRD.md) for the full
design and [`docs/research-notes.md`](docs/research-notes.md) for the research that
shaped it. Hand-maintained entity knowledge base in
[`entities.yaml`](entities.yaml). Repo-level agent instructions in
[`CLAUDE.md`](CLAUDE.md).

## Status

**Phase 2 — triage + extract + factcheck + Discord publish.** PRD §14.

Phase 1 (ingest + dedup + pre-filter) runs every 30 min via `.github/workflows/ingest.yml`.
Phase 2 runs at :15 and :45 past the hour via `.github/workflows/process.yml`, offset
15 minutes from ingest.

## Layout

```
patterns/
  triage/{pattern.md, schema.json}    PRD §10.1 — process/skip classifier
  extract/{pattern.md, schema.json}   PRD §10.2 — structured incident JSON
  factcheck/{pattern.md, schema.json} PRD §10.3 — field support + relationship fidelity

src/
  ingest/        RSS fetch, URL canonicalization, dedup, ingest run loop
  pipeline/      Chunker, merge, entity resolve, Phase 2 orchestrator
  patterns/      Runner, JSON Schema validator, template renderer, registry
  factcheck/     Deterministic checks, CVE cache, reconcile logic
  clients/       Anthropic, NVD, Brave, Discord
  discord/       Embed composer, publisher (POST/PATCH)
  turso/         libSQL client + articles / incidents / cve_cache repos
  entities/      entities.yaml loader
  util/          Shared helpers (rapidfuzz-style title similarity)

migrations/      0001 Phase 1 schema, 0002 Phase 2 widened incidents + cve_cache
scripts/         migrate.ts (tracked via a _migrations table)
tests/           node:test fixture tests, all offline
.github/workflows/
  ingest.yml     every 30 min
  process.yml   at :15 and :45
```

## Local dev

```bash
npm install
TURSO_DATABASE_URL="file:./local.db" npm run migrate
TURSO_DATABASE_URL="file:./local.db" npm run ingest
# ... articles land at stage_reached='deduped'
ANTHROPIC_API_KEY=...
MODEL_TRIAGE=claude-haiku-4-5 \
MODEL_EXTRACTION=claude-haiku-4-5 \
MODEL_FACTCHECK=claude-haiku-4-5 \
DISCORD_WEBHOOK_NEWS=https://discord.com/api/webhooks/... \
  TURSO_DATABASE_URL="file:./local.db" npm run process
npm test
npm run typecheck
```

## Secrets

Configured in GitHub Actions → Settings → Secrets and variables → Actions.

| Name | Kind | Where used | Required |
|---|---|---|---|
| `TURSO_DATABASE_URL` | secret | ingest + process | yes |
| `TURSO_AUTH_TOKEN` | secret | ingest + process | yes |
| `ANTHROPIC_API_KEY` | secret | process | yes |
| `DISCORD_WEBHOOK_NEWS` | secret | process | yes |
| `BRAVE_API_KEY` | secret | process | no (graceful degrade — corroboration is display-only) |
| `NVD_API_KEY` | secret | process | no (anonymous tier + Retry-After honored) |
| `MODEL_TRIAGE` | var | process | yes (e.g. `claude-haiku-4-5`) |
| `MODEL_EXTRACTION` | var | process | yes |
| `MODEL_FACTCHECK` | var | process | yes |
| `MAX_PROCESS_BATCH` | var | process | no (default 50) |

## Invariants (see CLAUDE.md)

- `entities.yaml` is hand-maintained. Never auto-update.
- One PRD phase per PR.
- Schema changes require a new file in `migrations/`.
- Errors are logged with `stage_reached`; never silently swallowed.
- Patterns produce strict JSON matching their `schema.json`. No freeform outputs
  from triage/extract/factcheck.
- Attribution discipline: "claims" vs "reported" vs "confirmed" are never flattened.
- Fact-check is a publish gate. Failures go to logs, not Discord.
