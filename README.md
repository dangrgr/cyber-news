# cyber-news

Personal cybersecurity news dissector. See [`docs/PRD.md`](docs/PRD.md) for the full
design and [`docs/research-notes.md`](docs/research-notes.md) for the research that
shaped it. Hand-maintained entity knowledge base in
[`entities.yaml`](entities.yaml). Repo-level agent instructions in
[`CLAUDE.md`](CLAUDE.md).

## Status

**Phase 3 — investigation workflow.** PRD §14.

- Phase 1 (ingest + dedup + pre-filter) runs every 30 min via `.github/workflows/ingest.yml`.
- Phase 2 (triage + extract + factcheck + Discord publish) runs at :15 and :45 past the
  hour via `.github/workflows/process.yml`, offset 15 minutes from ingest.
- Phase 3 (on-demand investigation) runs via `.github/workflows/investigate.yml` on
  `workflow_dispatch` with an `incident_id` input. Posts a Discord thread in
  `#cyber-investigations` with the full markdown report and evidence attachments.

**Deviation from PRD §11.3.** The Anthropic SDK's beta Managed Agents surface
(`beta.agents` / `environments` / `sessions`) is a minimal primitive that doesn't
match the PRD's imagined `routines/investigate.yaml` + CLI-deploy flow. Phase 3
implements the investigation agent via `messages.create` with tool use instead —
one native tool (`web_search`) plus five custom tools (`fetch_url`, `get_cve`,
`query_incidents`, `get_actor_profile`, `review_vendor_advisory`). Fully testable
with a mocked SDK; sandboxing trade-off is acceptable given our domain allowlist
and GH-runner-only execution.

## Layout

```
patterns/
  triage/{pattern.md, schema.json}           PRD §10.1 — process/skip classifier
  extract/{pattern.md, schema.json}          PRD §10.2 — structured incident JSON
  factcheck/{pattern.md, schema.json}        PRD §10.3 — field support + relationship fidelity
  investigate/pattern.md                     PRD §10.4 — OBSERVE→PLAN→FETCH→VERIFY→SYNTHESIZE
  vendor_doc_review/{pattern.md, schema.json} PRD §10.5 — advisory extraction (Haiku sub-call)

src/
  ingest/        RSS fetch, URL canonicalization, dedup, ingest run loop
  pipeline/      Chunker, merge, entity resolve, Phase 2 orchestrator
  patterns/      Runner, JSON Schema validator, template renderer, registry
  factcheck/     Deterministic checks, CVE cache, reconcile logic
  clients/       Anthropic (messages + tool-use), NVD, Brave, Discord
  discord/       Embed composer, publisher (POST/PATCH), investigation thread poster
  investigate/   Phase 3 orchestrator, custom tools, allowlist, extraction reconstruct
  turso/         libSQL client + articles / incidents / investigations / cve_cache repos
  entities/      entities.yaml loader
  util/          Shared helpers (rapidfuzz-style title similarity)

migrations/      0001 Phase 1 schema, 0002 Phase 2 widened incidents + cve_cache
scripts/         migrate.ts (tracked via a _migrations table)
tests/           node:test fixture tests, all offline
.github/workflows/
  ingest.yml       every 30 min
  process.yml      at :15 and :45
  investigate.yml  workflow_dispatch with incident_id input
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
| `DISCORD_WEBHOOK_INVESTIGATIONS` | secret | investigate | yes — point at a **forum** channel so `thread_name` creates a fresh thread per run |
| `MODEL_INVESTIGATION` | var | investigate | yes (e.g. `claude-sonnet-4-6`) |
| `MODEL_VENDOR_DOC_REVIEW` | var | investigate | yes (e.g. `claude-haiku-4-5`) |
| `MAX_INVESTIGATION_COST_USD` | var | investigate | no (default 1.5) |
| `MAX_INVESTIGATION_TOOL_CALLS` | var | investigate | no (default 40) |

## Running an investigation

From the GH mobile app: Actions → Investigate → Run workflow → paste the
`incident_id` (the footer of any `#cyber-news` embed). The workflow posts a
parent thread message within seconds, runs the Sonnet agent (typically 3–8
minutes), posts the full markdown report + evidence JSON as attachments in
the thread, and commits `logs/investigations/{incident_id}.md` back to the
repo.

If `incidents.investigation_status='complete'` already, the workflow exits
without re-running. To force a re-investigation, reset the status in Turso
first:

```sql
UPDATE incidents SET investigation_status = 'none' WHERE id = '<incident_id>';
```

## Invariants (see CLAUDE.md)

- `entities.yaml` is hand-maintained. Never auto-update.
- One PRD phase per PR.
- Schema changes require a new file in `migrations/`.
- Errors are logged with `stage_reached`; never silently swallowed.
- Patterns produce strict JSON matching their `schema.json`. No freeform outputs
  from triage/extract/factcheck.
- Attribution discipline: "claims" vs "reported" vs "confirmed" are never flattened.
- Fact-check is a publish gate. Failures go to logs, not Discord.
