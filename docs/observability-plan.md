# Plan: cyber-news observability — persist run logs, capture telemetry

**Repo:** `dangrgr/cyber-news` (TypeScript ESM, Node 20+, libsql/Turso, Anthropic SDK)
**Source:** `TODO.md` on `main`
**PR slicing:** 5 PRs (TODO's items 1+2 ship together; 3, 4, 5 standalone; +PR 5 MCP tool added per follow-up)

---

## Context

When iterating on the cyber-news pipeline, outputs land in three opaque destinations: Turso DB (needs SQL), Discord webhooks (invisible from CLI/agent), and stdout JSON summaries (vanish when the workflow ends). Investigation has decent introspection (`logs/investigations/{id}.md` + per-result cost tracking), but Phases 1–2 don't — `ProcessSummary` is counts only, with no per-pattern cost, no per-call I/O, and no failure detail surfaced where a read-only tool can see it.

The CLAUDE.md invariant *"Fact-check is a publish gate. Failures go to logs, not to Discord"* is what makes this gap matter: the most valuable debugging signal — *why didn't this incident publish?* — is **by design** absent from Discord. Run logs are the answer.

**Larger goal.** Telemetry that a coding agent (Claude Code on Max plan) can read freely to judge how well the pipeline is working, find where to add features, and run before/after comparisons across code changes. Reads cost nothing on Max — design accordingly: capture liberally, optimize for query speed and exploratory access, not for log-size frugality.

---

## Cross-cutting decisions (resolved before any PR)

| Decision | Choice | Rationale |
|---|---|---|
| Haiku rates | Bake `DEFAULT_HAIKU_RATES = {input: 1, output: 5}` USD/M into `src/util/cost.ts` alongside Sonnet | CLAUDE.md cost discipline: triage/extract/factcheck use Haiku. TODO mentions only Sonnet — gap closed. |
| DRY_RUN scope | Wire at `src/clients/discord.ts` (the actual HTTP chokepoint), not `src/discord/*.ts` publishers | Single chokepoint, single test, zero drift. Deviates from TODO wording but matches TODO intent. |
| `payload_digest` | SHA-256 of canonical JSON, first 16 hex chars | Built-in `crypto`, no new dep. 64 bits enough for intra-run correlation. |
| Run-log threading | Optional `runLog?: RunLogger` field on `RunnerDeps` | Non-breaking. Existing call sites without logger still work. |
| `run_summary` event | Emitted by `finishRun(summary)` as final NDJSON line | Same data as stdout JSON, different consumers. Not redundant. |
| Discord client wiring | Extend `createDiscordClient({ webhookUrl, runLog? })` factory options | Matches existing factory-with-options pattern. Avoids module-level singleton. |
| Summary generation | Standalone `scripts/gen_run_summary.ts` reading INDEX.ndjson via argv | Separation of concerns; doesn't require build to run. |
| **Kill-switch** | `RUN_LOG_DISABLED=1` env → `NOOP_LOGGER` | Belt-and-suspenders safety. Flip a workflow secret to disable in seconds. |
| **Schema version** | `schema_version: 1` on every NDJSON line (18 bytes) | Cheap insurance against future drift. |
| **Raw output capture** | **No truncation.** Capture full `raw_model_output` text. | Free reads on Max plan → exploratory queries are valuable. Disk is cheap (NDJSON ~100–500 KB/run). |
| **Persistence** | **Commit NDJSON to git** under `logs/runs/{date}/`. INDEX.ndjson committed forever. | `gh api repos/.../contents/logs/runs/...` is the agent's read path — same pattern Ghost uses for Pinchy. ~900 MB/year repo bloat is acceptable for a personal-project public repo; reversible via `git filter-repo` if it ever matters. |
| **INDEX file** | `logs/runs/INDEX.ndjson` — one append-only digest line per `finishRun()` | Single biggest agent-readability win. ~500 bytes/run × N runs forever ≈ tiny. Two-tier access: INDEX for discovery, per-run NDJSON for drilldown. |
| **Failure codes** | Stable enum on every failure event, alongside free-form `reason` | Free-form strings don't aggregate. Codes do. |
| **Article trace** | `event: "article_done"` on success **and** failure, with per-stage cost/duration | Mirror failure events for successes. Full per-article lineage queryable with one `jq` filter. |
| **Run metadata** | `run_start` event carries `git_sha`, `models_active`, `dry_run`, `node_env`, source counts | Lets agent correlate runs to code state — critical for A/B before/after analysis. |
| **MCP tool** | Local stdio MCP server in cyber-news (`scripts/mcp_run_log.ts`), registered in `.mcp.json` | Thin wrapper over committed NDJSON. Lets Claude Code query without composing `gh api` + `jq` chains. |

---

## PR 1 — Run-log foundation + DRY_RUN + commit-to-git (items 1+2)

**Goal.** Run-log infrastructure with kill-switch + schema versioning, wired into `runPattern` and both pipeline entry points. DRY_RUN at Discord client. INDEX.ndjson + per-run NDJSON committed to git.

### Files to create

- `src/util/cost.ts` — extracted rates/computation
- `src/util/run_log.ts` — NDJSON logger with `NOOP_LOGGER` for kill-switch
- `tests/util/cost.test.ts` — rate math
- `tests/util/run_log.test.ts` — file naming, NDJSON validity, finishRun ordering, kill-switch behavior
- `logs/runs/.gitkeep` — preserve directory in fresh clones

### Files to modify

- `src/investigate/orchestrator.ts` — import `DEFAULT_SONNET_RATES` + `computeCost` from `src/util/cost.ts` (no behavior change)
- `src/patterns/runner.ts` — extend `RunnerDeps` with `runLog?: RunLogger`; emit `model_call` events; populate `rawOutput` on `PatternRunResult`
- `src/pipeline/run_process.ts` — `startRun("process")`, thread into `deps`, `finishRun(summary)`
- `src/ingest/run.ts` — `startRun("ingest")`, wrap `runIngest()`, `finishRun(stats)`
- `src/clients/discord.ts` — accept `runLog` in factory options; DRY_RUN guard in `postMessage`/`patchMessage`; emit `discord_payload` event on every send
- `.gitignore` — **do not** ignore `logs/runs/`. Files there are committed.
- `CLAUDE.md` — new "Local development" subsection: `DRY_RUN=1`, `RUN_LOG_DISABLED=1`

### Public interfaces

```typescript
// src/util/cost.ts
export interface ModelRates { inputPerMillion: number; outputPerMillion: number; }
export const DEFAULT_SONNET_RATES: ModelRates = { inputPerMillion: 3, outputPerMillion: 15 };
export const DEFAULT_HAIKU_RATES:  ModelRates = { inputPerMillion: 1, outputPerMillion: 5  };
export function computeCost(inputTokens: number, outputTokens: number, rates: ModelRates): number;
export function ratesForModel(modelId: string): ModelRates; // 'haiku' substring → Haiku, else Sonnet

// src/util/run_log.ts
export const SCHEMA_VERSION = 1;

export interface RunLogger {
  runId: string;
  stage: string;
  logCall(p: { model: string; input_tokens: number; output_tokens: number; cost_usd: number; duration_ms: number; payload_digest?: string; raw_output?: string; error?: string }): void;
  logEvent(p: { event: string; [k: string]: unknown }): void;
  finishRun(summary: Record<string, unknown>): Promise<void>;
}

export function startRun(stage: string): RunLogger;
// - if RUN_LOG_DISABLED === "1" → returns NOOP_LOGGER (every method is a no-op, finishRun resolves immediately)
// - otherwise: opens logs/runs/{YYYY-MM-DD}/{stage}-{runId}.ndjson append stream
// - emits run_start event with: { schema_version, run_id, stage, ts, git_sha, models_active, dry_run, node_env, cwd }
// - finishRun: writes run_summary line, closes stream, then appends one digest row to logs/runs/INDEX.ndjson
```

### INDEX.ndjson row schema

```json
{"schema_version":1,"run_id":"abc12345","stage":"process","started_at":"2026-05-09T18:30:00Z","finished_at":"2026-05-09T18:30:42Z","duration_ms":42013,"git_sha":"b45db92","dry_run":false,"summary":{"articles_processed":23,"published":4,"triage_rejected":12,"factcheck_failed":7,"total_cost_usd":0.0234},"file":"logs/runs/2026-05-09/process-abc12345.ndjson"}
```

### Wiring sketch

```typescript
// src/patterns/runner.ts — inside runPattern, around anthropic.messages.create()
const t0 = Date.now();
const result = await anthropic.messages.create(...);
const duration_ms = Date.now() - t0;
if (deps.runLog) {
  const rates = ratesForModel(result.model);
  deps.runLog.logCall({
    model: result.model,
    input_tokens: result.usage.input_tokens,
    output_tokens: result.usage.output_tokens,
    cost_usd: computeCost(result.usage.input_tokens, result.usage.output_tokens, rates),
    duration_ms,
    payload_digest: digest(canonicalInput),
    raw_output: rawText,  // FULL text, no truncation
  });
}

// src/pipeline/run_process.ts::main()
const log = startRun("process");
const discord = createDiscordClient({ webhookUrl, runLog: log });
try {
  const summary = await processPendingArticles({ db, anthropic, discord, brave, cveCache, runLog: log });
  await log.finishRun(summary);
  console.log(JSON.stringify({ process: "complete", ...summary }));
} catch (e) {
  await log.finishRun({ error: String(e) });
  throw e;
}

// src/clients/discord.ts — inside postMessage
const dryRun = process.env.DRY_RUN === "1";
runLog?.logEvent({ event: "discord_payload", dry_run: dryRun, payload_digest: digest(JSON.stringify(payload)), payload });
if (dryRun) return { messageId: "dry-run-noop" };
// existing fetch logic unchanged
```

### Tests

- `tests/util/cost.test.ts`: rate math, `ratesForModel("claude-haiku-4-5")`, edge cases
- `tests/util/run_log.test.ts`:
  - `startRun()` creates file at expected path; emits `run_start` with `git_sha`
  - `logCall`/`logEvent` write parseable NDJSON; full `raw_output` captured (no truncation)
  - `finishRun` writes `run_summary` final line + appends INDEX row + flushes
  - `RUN_LOG_DISABLED=1` → NOOP_LOGGER; no file created
  - INDEX append is atomic for sub-PIPE_BUF rows
- Extend `tests/pipeline/process_e2e.test.ts`:
  - `DRY_RUN=1` → mocked `fetch` never called; `discord_payload` logged with `dry_run: true`

### Risks / open questions

- **Stream flush on crash**: `finishRun` is async (awaits stream end). Wrap in try/finally at entry points so partial logs aren't lost.
- **INDEX.ndjson concurrency**: GitHub Actions cron workflows can theoretically overlap. PR 4 adds `concurrency:` keys to workflows to prevent. For this PR, single-process append is fine.
- **`git_sha` resolution**: in CI, `process.env.GITHUB_SHA` is authoritative. Locally, fall back to `execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()` (no shell — avoids injection class entirely). Wrap in try/catch for non-git environments.
- **`logs/runs/.gitkeep` interaction**: with NDJSON committed, .gitkeep is only needed for fresh clones. Keep it; harmless.
- **Repo bloat**: ~50 KB/run × 50 runs/day × 365 ≈ 900 MB/year. Acceptable for a personal-project public repo. If bloat becomes a problem in 2-3 years, prune via `git filter-repo` or move old runs to artifacts.

---

## PR 2 — Per-stage cost rollup + per-article trace events (item 3 + agent-read enhancement)

**Goal.** Extend `ProcessSummary` with per-stage cost breakdowns. Emit `article_done` events for every article (success and failure) with per-stage costs and durations.

**Prerequisite:** PR 1 merged.

### Files to modify

- `src/patterns/runner.ts` — extend `PatternRunResult<O>` with `{ input_tokens?, output_tokens?, cost_usd?, model?, rawOutput? }`
- `src/pipeline/process.ts` — extend `ProcessSummary`; accumulate per-stage; emit `article_done` event per article
- `tests/pipeline/process_e2e.test.ts` — assert summary shape and `article_done` events

### Public interfaces

```typescript
// src/patterns/runner.ts
export interface PatternRunResult<O> {
  success: boolean;
  output?: O;
  error?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  model?: string;
  rawOutput?: string;  // full text
}

// src/pipeline/process.ts
export interface StageCosts { calls: number; input_tokens: number; output_tokens: number; cost_usd: number; }
export interface ProcessSummary {
  processed: number;
  triage_rejected: number;
  extracted: number;
  factcheck_failed: number;
  published: number;
  model_calls: number;  // backward compat; equals costs.total.calls
  costs: { triage: StageCosts; extract: StageCosts; factcheck: StageCosts; total: StageCosts };
}
```

### `article_done` event schema

```json
{"schema_version":1,"event":"article_done","ts":"...","run_id":"...","article_id":"...","article_url":"...","source_id":"schneier","terminal_state":"published","duration_ms":2340,"stages":{"triage":{"cost_usd":0.0001,"input_tokens":1200,"output_tokens":150,"duration_ms":300},"extract":{"cost_usd":0.0008,"input_tokens":4500,"output_tokens":600,"duration_ms":1100},"factcheck":{"cost_usd":0.0003,"input_tokens":2200,"output_tokens":400,"duration_ms":900}}}
```

`terminal_state` values: `published | triage_rejected | factcheck_failed | error`.

### Wiring sketch

```typescript
// in processPendingArticles, around each runPattern call: accumulate per-stage
function accumulate(bucket: StageCosts, r: PatternRunResult<unknown>) {
  if (r.cost_usd === undefined) return;
  bucket.calls += 1;
  bucket.input_tokens += r.input_tokens ?? 0;
  bucket.output_tokens += r.output_tokens ?? 0;
  bucket.cost_usd += r.cost_usd;
}

// at end of each article (success or failure), emit article_done
deps.runLog?.logEvent({
  event: "article_done",
  article_id: article.id,
  article_url: article.url,
  source_id: article.source_id,
  terminal_state: outcome,
  duration_ms: Date.now() - articleStart,
  stages: { triage: stageData.triage, extract: stageData.extract, factcheck: stageData.factcheck },
});
```

### Tests

- Unit: mock `runPattern` returns; assert `costs.triage.cost_usd` accumulates correctly
- E2E: full pipeline with seeded fixtures; assert one `article_done` per processed article; `terminal_state` values correct
- Snapshot: stdout JSON includes `costs` key

### Risks

- `model_calls` becomes redundant. Keep one release; add `// TODO: remove after agent dashboards consume costs.total.calls`.
- `article.source_id` and `article.url` availability: confirm both are on the article object passed to `processOne()`.

---

## PR 3 — Failure log surface with stable failure codes (item 4)

**Goal.** Emit structured failure records to the run log alongside `setStage` DB writes, with stable `failure_code` enum for aggregation.

**Prerequisite:** PR 1 merged. Independent of PR 2 (could ship before).

### Files to modify

- `src/patterns/runner.ts` — emit `pattern_parse_error` event on JSON/Zod parse failure; ensure `rawOutput` is on `PatternRunResult` even on failure
- `src/pipeline/process.ts` — `runLog.logEvent` at all 4 failure sites with `failure_code`
- `src/pipeline/failure_codes.ts` (new) — exported enum
- `tests/pipeline/process_e2e.test.ts` — extend with failure assertions

### Failure code enum

```typescript
// src/pipeline/failure_codes.ts
export type FailureCode =
  | "triage_low_severity"
  | "triage_off_topic"
  | "triage_duplicate"
  | "factcheck_no_corroboration"
  | "factcheck_cve_mismatch"
  | "factcheck_entity_unresolved"
  | "factcheck_unhandled"
  | "pattern_json_invalid"
  | "pattern_schema_invalid"
  | "unhandled_exception";
```

The exact triage/factcheck reason categories may need refinement based on actual `triage.output.reason` shapes — implementing agent should grep for the concrete reasons currently being persisted via `setStage` and map them to codes. If a reason doesn't fit, default to `*_unhandled` and add a TODO.

### Failure event schema

```json
{"schema_version":1,"event":"factcheck_failed","ts":"...","run_id":"...","stage":"factcheck_deterministic","article_id":"...","failure_code":"factcheck_no_corroboration","reason":"only 1 of 3 required sources matched","raw_model_output":"...full text, no truncation...","stage_reached":"factcheck_deterministic"}
```

### Wiring sketch

```typescript
// at each failure site in src/pipeline/process.ts
deps.runLog?.logEvent({
  event: "triage_rejected",
  article_id: article.id,
  failure_code: mapTriageReason(triage.output.reason),  // → "triage_low_severity" | "triage_off_topic" | ...
  reason: triage.output.reason,
  raw_model_output: triageResult.rawOutput,  // full text
  stage_reached: "triage",
});
```

### Tests

- Mock pattern returns failure → assert `logEvent` called with correct `failure_code`
- Aggregation test: e2e seeded with mixed failures; `jq 'select(.event=="factcheck_failed") | .failure_code' | sort | uniq -c` returns expected counts
- Map function (`mapTriageReason`, etc.) unit-tested against real `triage.output.reason` strings

### Risks

- **Failure code drift**: if reasons don't map cleanly, the implementer must grep `setStage(..., "factcheck_failed", ...)` call sites to enumerate real reason strings. Document the mapping in `failure_codes.ts` comments.
- **`raw_model_output` on parse-failure path**: runner must capture raw text *before* parse attempt. Verify try/catch placement in `runPattern`.

---

## PR 4 — GitHub Actions log capture + summary commit (item 5)

**Goal.** Workflows commit a redacted `summary.md` (driven by INDEX.ndjson) and add `concurrency:` to prevent INDEX append races.

**Prerequisite:** PRs 1, 2, 3 merged.

### Files to create

- `scripts/gen_run_summary.ts` — reads INDEX.ndjson, prints markdown to stdout. Aggregates last N days using `failure_code` enum.

### Files to modify

- `.github/workflows/process.yml` — add `concurrency:`, summary generation, summary commit
- `.github/workflows/ingest.yml` — same pattern
- `.github/workflows/investigate.yml` — already has auto-commit pattern; add `concurrency:` only

### `scripts/gen_run_summary.ts` shape

```typescript
// Usage: tsx scripts/gen_run_summary.ts [--days=7] > logs/runs/summary.md
// - reads logs/runs/INDEX.ndjson
// - filters last N days (default 7)
// - aggregates: total runs, total cost, total articles processed/published, per-failure-code counts
// - emits markdown table; no raw model output
```

### Workflow step pattern

```yaml
concurrency:
  group: cyber-news-pipeline
  cancel-in-progress: false

# ... existing steps that run the pipeline ...

# Pipeline step now writes logs/runs/{date}/*.ndjson AND appends INDEX.ndjson

- name: Generate summary
  if: always()
  run: npx tsx scripts/gen_run_summary.ts --days=7 > logs/runs/summary.md

- name: Commit logs and summary
  if: always()
  run: |
    if [[ -n "$(git status --porcelain logs/runs/)" ]]; then
      git config user.name "github-actions[bot]"
      git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
      git pull --rebase origin main || true   # handle concurrent commits from other workflow stages
      git add logs/runs/
      git commit -m "chore: run logs ${{ github.run_id }} [skip ci]"
      git push
    fi
```

### Tests

- Unit test for `scripts/gen_run_summary.ts` — fixture INDEX.ndjson; snapshot markdown output
- Smoke: run `DRY_RUN=1 npm run process` locally → assert `logs/runs/INDEX.ndjson` has new row + `gen_run_summary` produces valid markdown

### Risks

- **Concurrency**: `concurrency:` key on workflows ensures only one runs per group. `git pull --rebase` before push handles cases where the run *did* race anyway.
- **`[skip ci]`** on the commit: confirm no required status check breaks (cyber-news has no required checks today; safe).
- **Repo growth**: NDJSON files are tiny (<500 KB/run for very busy runs). Worst case ~10 GB after 5 years — handle with `git filter-repo` if it ever bites.

---

## PR 5 — MCP tool for run-log queries (capstone)

**Goal.** Local stdio MCP server exposing committed NDJSON as queryable tools. Lets Claude Code (CLI/remote/web) query telemetry without composing `gh api` + `jq` chains.

**Prerequisite:** PRs 1–4 merged. Data shape stable, NDJSON committed, INDEX populated.

### Files to create

- `scripts/mcp_run_log.ts` — Node MCP server (stdio transport)
- `tests/scripts/mcp_run_log.test.ts` — unit tests for each tool

### Files to modify

- `package.json` — add `@modelcontextprotocol/sdk` (and confirm if `zod` is already a dep — needed for arg validation)
- `.mcp.json` (new at repo root, OR documented for user-level config) — register the server
- `CLAUDE.md` — document the MCP tools so future Claude Code sessions know they're available

### MCP tools exposed

```typescript
// runlog_list_runs — read INDEX.ndjson, filter, return digests
runlog_list_runs(args: {
  stage?: "process" | "ingest" | "investigate";
  since?: string;     // ISO date
  until?: string;     // ISO date
  git_sha?: string;
  limit?: number;     // default 50
}): RunDigest[]

// runlog_get_run — read full NDJSON for a run
runlog_get_run(args: { run_id: string }): { events: NDJSONEvent[]; summary: ProcessSummary }

// runlog_query_failures — search failure events across runs
runlog_query_failures(args: {
  failure_code?: FailureCode;
  stage?: string;
  since?: string;
  until?: string;
  article_id?: string;
  limit?: number;
}): FailureEvent[]

// runlog_get_article_trace — find all events for an article (across stages and runs)
runlog_get_article_trace(args: { article_id: string }): NDJSONEvent[]

// runlog_recent_health — aggregate INDEX over last N days
runlog_recent_health(args: { days?: number }): {
  runs: number;
  articles_processed: number;
  published: number;
  total_cost_usd: number;
  failure_breakdown: Record<FailureCode, number>;
  top_failing_sources: Array<{ source_id: string; failure_count: number }>;
}

// runlog_compare_runs — diff two runs' summaries (useful for before/after a code change)
runlog_compare_runs(args: { run_id_a: string; run_id_b: string }): RunDiff
```

### Implementation notes

- Use `@modelcontextprotocol/sdk/server/stdio.js`
- Tool implementations are pure functions over filesystem reads (`fs.readFile`, `readline` for streaming)
- Repo root resolution: `process.env.CYBER_NEWS_ROOT` env var, or CLI arg `--root <path>`, or default to `process.cwd()`
- Validate args with `zod` (or basic type guards if zod isn't already a dep)
- Use streaming for INDEX (which can grow large)
- No auth — stdio-only, local trust boundary
- Tool prefix `runlog_*` to avoid collision with other MCPs Dan may add

### `.mcp.json` registration

```json
{
  "mcpServers": {
    "cyber-news-runlog": {
      "command": "npx",
      "args": ["tsx", "scripts/mcp_run_log.ts", "--root", "."]
    }
  }
}
```

### Tests

- Each tool: fixture NDJSON files in `tests/fixtures/run_logs/`; assert correct output for typical and edge cases
- Edge cases: empty INDEX, missing run files, malformed NDJSON lines (skip with warning, don't crash)
- `runlog_recent_health` aggregation correctness against a known fixture
- Repo root resolution: env var > CLI arg > cwd

### Risks / open questions

- **New dependency**: `@modelcontextprotocol/sdk`. CLAUDE.md says "No new external dependencies without noting the free-tier status in the PR." Note in PR description: SDK is MIT-licensed, no runtime cost.
- **MCP discoverability across sessions**: `.mcp.json` at repo root is auto-loaded by Claude Code when working in cyber-news. For Ghost sessions reading cyber-news remotely without a clone, this MCP isn't reachable — those sessions fall back to `gh api`. Acceptable; add a note in `CLAUDE.md`.
- **Streaming large NDJSON**: `runlog_get_run` on a run with 100+ articles could return MBs. Add a `limit` arg or truncate `raw_output` on tool output (committed file keeps full text). Decide based on real usage.

---

## PR slicing rationale

- **PR 1** (items 1+2 + commit-to-git): genuinely coupled — DRY_RUN logs `discord_payload` events that need `RunLogger`. Committing NDJSON + INDEX is a natural fit since both are written by `finishRun`.
- **PR 2** (item 3 + per-article trace): purely additive type extensions on `PatternRunResult` + `ProcessSummary`. Article trace events are a natural extension of cost rollup.
- **PR 3** (item 4 + failure codes): depends only on `RunLogger.logEvent`. Could ship before PR 2.
- **PR 4** (item 5): hard depends on PRs 1–3. Reads INDEX (PR 1), uses cost data (PR 2), aggregates by failure_code (PR 3).
- **PR 5** (MCP tool): hard depends on PRs 1–4. The data shape needs to be stable before wrapping it in a tool.

Total: **5 PRs in dependency order**, matches TODO conventions plus capstone.

---

## Verification

End-to-end smoke test for the full stack (after PR 4 merges):

```bash
# 1. Run pipeline locally with DRY_RUN
DRY_RUN=1 npm run process

# 2. Verify NDJSON exists and is valid
ls logs/runs/$(date +%Y-%m-%d)/process-*.ndjson
jq -c . logs/runs/$(date +%Y-%m-%d)/process-*.ndjson | wc -l   # parses every line

# 3. Verify INDEX.ndjson appended
tail -1 logs/runs/INDEX.ndjson | jq .

# 4. Verify discord_payload events captured (no real POST)
jq 'select(.event == "discord_payload")' logs/runs/$(date +%Y-%m-%d)/process-*.ndjson

# 5. Verify cost rollup populated
jq 'select(.event == "run_summary") | .costs' logs/runs/$(date +%Y-%m-%d)/process-*.ndjson

# 6. Verify article_done events
jq 'select(.event == "article_done")' logs/runs/$(date +%Y-%m-%d)/process-*.ndjson

# 7. Verify failure_code on failure events
jq 'select(.event | endswith("_failed") or endswith("_rejected")) | .failure_code' logs/runs/$(date +%Y-%m-%d)/process-*.ndjson

# 8. Generate summary
npx tsx scripts/gen_run_summary.ts --days=7

# 9. Run unit tests
npm test

# 10. Kill-switch
RUN_LOG_DISABLED=1 DRY_RUN=1 npm run process
# → no new files in logs/runs/, pipeline still runs to completion
```

After PR 5 merges:

```bash
# 11. MCP server starts
npx tsx scripts/mcp_run_log.ts --root .

# 12. From a Claude Code session in cyber-news, the runlog_* tools are available
#     (manually verify via /mcp slash command or invoke runlog_recent_health)
```

CI verification: trigger a manual `workflow_dispatch` on `process.yml`, verify `logs/runs/{date}/*.ndjson` and `logs/runs/INDEX.ndjson` and `logs/runs/summary.md` are committed in a single push.

---

## Critical files reference

| File | Role |
|---|---|
| `src/util/cost.ts` (new) | Rate constants + `computeCost` + `ratesForModel` |
| `src/util/run_log.ts` (new) | `startRun` / `RunLogger` / `NOOP_LOGGER` (NDJSON writer + INDEX append) |
| `src/pipeline/failure_codes.ts` (new, PR 3) | `FailureCode` enum + reason-to-code mappers |
| `src/patterns/runner.ts` | Single chokepoint; emits `model_call` + `pattern_parse_error` |
| `src/pipeline/process.ts` | `processPendingArticles` — `ProcessSummary` lives here, all 4 failure sites, `article_done` emission |
| `src/pipeline/run_process.ts` | Process entry — `startRun`/`finishRun` wrapping |
| `src/ingest/run.ts` | Ingest entry — `startRun`/`finishRun` wrapping |
| `src/clients/discord.ts` | DRY_RUN guard + `discord_payload` event |
| `scripts/gen_run_summary.ts` (new, PR 4) | INDEX → markdown |
| `scripts/mcp_run_log.ts` (new, PR 5) | MCP server |
| `.github/workflows/{process,ingest,investigate}.yml` | `concurrency:` + commit logs/summary |
| `logs/runs/INDEX.ndjson` (new, populated by PR 1) | Append-only run digest — primary discovery surface |

## Reuse pointers

- `setStage()` in `src/turso/articles.ts` — keep as-is; failure-log writes are additive next to existing calls
- `withRetry()` in `src/clients/discord.ts` — DRY_RUN check goes outside retry wrapper (no point retrying a no-op)
- `createAnthropicClient()` / `createDiscordClient()` factories in `src/clients/` — extension pattern
- `investigate.yml` auto-commit step — reference for `logs/runs/` commit pattern (already validates input format)
- `node:test` + `:memory:` libsql pattern from `tests/pipeline/process_e2e.test.ts` — reuse for new e2e assertions
- `DEFAULT_SONNET_RATES` + `computeCost()` currently in `src/investigate/orchestrator.ts` — moving, not duplicating
