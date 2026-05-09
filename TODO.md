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

### 1. Persisted run logs (foundational)
- [ ] New `src/util/run_log.ts`: `startRun(stage)` → `runId`; `logCall(...)`;
      `finishRun(summary)`. Writes NDJSON to
      `logs/runs/{YYYY-MM-DD}/{stage}-{runId}.ndjson`.
- [ ] Line schema: `{ts, run_id, stage, event, model?, input_tokens?,
      output_tokens?, cost_usd?, duration_ms?, error?, payload_digest?}`.
- [ ] Extract cost rates from `src/investigate/orchestrator.ts`
      (`DEFAULT_SONNET_RATES`) into `src/util/cost.ts` first; share between
      investigation and run-log.
- [ ] Wire into `src/patterns/runner.ts` — one call site covers all patterns.
- [ ] Wire run-level start/finish into `src/pipeline/run_process.ts` and
      `src/ingest/run.ts`.
- [ ] `logs/runs/` added to `.gitignore`. Workflows opt in to commit a
      redacted `summary.md` (see #5).
- [ ] Fixture test in `tests/util/run_log.test.ts`.

### 2. Capture Discord payloads + dry-run
- [ ] In `src/discord/*.ts` (webhook publishers), append the embed JSON to
      the current run log (`event: "discord_payload"`) on every send.
- [ ] Add `DRY_RUN=1` env flag (or `--no-publish` CLI flag) to short-circuit
      the actual webhook POST. Pipeline still runs end-to-end and writes
      run logs; channel stays clean.
- [ ] Document in CLAUDE.md under a "Local development" subsection.

### 3. Per-stage cost/token rollup in `ProcessSummary`
- [ ] Extend `ProcessSummary` with per-stage breakdown:
      `{triage|extract|factcheck: {calls, input_tokens, output_tokens,
      cost_usd}}`. Aggregated from the run log.
- [ ] Surface in stdout JSON and as a final `event: "run_summary"` NDJSON
      line (so summary is in the same file as the per-call detail).

### 4. Failure log surface
- [ ] On `factcheck_failed` / `triage_rejected` / pattern parse errors,
      write a full record to the run log: article_id, stage, reason, raw
      model output (or first 500 chars), `stage_reached`.
- [ ] Today these are buried in `articles.failure_reason`. Goal: grep-able
      from `logs/runs/` without DB access.

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
