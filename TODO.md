# TODO: Agent output visibility

Backlog for making pipeline outputs and telemetry inspectable to the coding
agent (and the human dev) without re-running the pipeline. v0 — may be
revised after a desktop stress-test against an exported Discord feed.

## Why

When iterating on this project, outputs land in three opaque destinations:

- **Turso DB** — needs SQL to inspect.
- **Discord webhooks** — invisible from a CLI / agent context.
- **stdout JSON summaries** — vanish when the workflow finishes.

Investigation has decent introspection (`logs/investigations/{id}.md`, plus
`cost_usd` / `terminated_reason` on `InvestigationResult`). Phases 1–2 don't:
`ProcessSummary` is counts only — no per-pattern cost, no per-call I/O, no
failure detail surfaced anywhere a read-only tool can see.

CLAUDE.md invariant: *"Fact-check is a publish gate. Failures go to logs,
not to Discord."* That means the most valuable debugging signal — *why
didn't this incident publish?* — is by design absent from Discord. Run logs
are the answer, not Discord export.

## Items (priority order)

### 1. Persisted run logs (foundational) — shipped #12
- [x] `src/util/run_log.ts`: `startRun(stage)` → `runId`; `logCall(...)`;
      `finishRun(summary)`. NDJSON at `logs/runs/{YYYY-MM-DD}/{stage}-{runId}.ndjson`.
- [x] Schema-versioned line format with `schema_version: 1`.
- [x] Cost rates extracted into `src/util/cost.ts`, shared with investigation.
- [x] Wired into `src/patterns/runner.ts` (covers all patterns) +
      `src/pipeline/run_process.ts` + `src/ingest/run.ts`.
- [x] NDJSON committed to git (`logs/runs/` is intentionally tracked, not
      gitignored). INDEX.ndjson is the discovery surface.
- [x] `RUN_LOG_DISABLED=1` kill-switch + fixture tests.

### 2. Capture Discord payloads + dry-run — shipped #12
- [x] DRY_RUN at the HTTP chokepoint (`src/clients/discord.ts`).
      `discord_payload` events emitted on every send.
- [x] `DRY_RUN=1` env short-circuits POST/PATCH before `withRetry`.
- [x] Documented in `CLAUDE.md` under "Local development".

### 3. Per-stage cost/token rollup in `ProcessSummary` — shipped #13
- [x] `ProcessSummary.costs.{triage,extract,factcheck,total}` with
      `{calls, input_tokens, output_tokens, cost_usd}`. `total` = sum of stages.
- [x] `article_done` events emitted per article with `terminal_state` and
      per-stage metrics.
- [x] `model_calls` kept one release as back-compat alias for `costs.total.calls`.

### 4. Failure log surface (in flight)
- [x] `src/pipeline/failure_codes.ts` — stable `FailureCode` enum +
      `mapTriageReason` / `mapDeterministicKind` / `mapReconcileReason` /
      `failureCodeFromError`.
- [x] `pattern_parse_error` events emitted from `src/patterns/runner.ts` on
      JSON-parse and schema-validation throws (with full `raw_output`).
- [x] Dedicated failure events (`triage_rejected`, `factcheck_failed`,
      `article_error`) emitted at the 4 failure sites in
      `src/pipeline/process.ts` with `failure_code` + `failure_reason`.
- [x] `article_done` extended with `failure_code` / `failure_codes` /
      `failure_reason` on failure paths.
- [ ] Tighten `patterns/triage/schema.json` with a `reason_code` enum
      (follow-up; current keyword matcher in `mapTriageReason` falls back
      to `triage_unhandled` for unrecognized strings).

### 5. GitHub Actions log capture
- [ ] After each scheduled run, the workflow writes
      `logs/runs/{date}/{stage}-summary.md` (one redacted file per run) and
      commits via the same auto-commit pattern `investigate.yml` already
      uses for `logs/investigations/`.
- [ ] Full NDJSON uploaded as a workflow artifact (cheap belt + suspenders;
      retained per repo's default artifact lifetime).

## Future direction (desktop MCP)

A future desktop Claude session could add MCP tools for:

1. **Read-only Turso queries** — `articles`, `incidents`, `investigations`
   without hand-writing SQL.
2. **`logs/runs/` tail / grep** — read NDJSON from item 1 of this TODO
   without rerunning.
3. **Discord export on-demand** (e.g. wrapping Tyrrrz/DiscordChatExporter)
   — fetch the last N hours of `#cyber-news` / `#cyber-investigations`.
   Complements run logs (which capture *non-published* failure paths);
   doesn't replace them. Tradeoff vs a scheduled cron: no committed
   historical archive unless the desktop session opts to commit pulls —
   acceptable for personal-project scale.

All three left unspecced — design with full context in a future session.

## Conventions

- One PRD-phase-equivalent per PR. Items 1+2 can ship together (foundational
  + immediate dry-run win); 3, 4, 5 each ship standalone.
- Items 1–4 are TypeScript code under `src/`; item 5 is YAML under
  `.github/workflows/`. No new external dependencies expected.
