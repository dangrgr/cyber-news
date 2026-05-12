// Local stdio MCP server exposing the committed run-log NDJSON as queryable
// tools. Per docs/observability-plan.md PR 5.
//
// Tools are pure functions over filesystem reads — no DB, no network, no
// process state. The server streams INDEX.ndjson + per-run files via
// `readline`, mirroring scripts/gen_run_summary.ts. INDEX is small today
// (~500 B/run) but per-run files can carry hundreds of KB of `raw_output`
// per `model_call`; stream and truncate rather than slurp.
//
// Usage:
//   tsx scripts/mcp_run_log.ts [--root <path>]
//
// Repo-root resolution priority: CYBER_NEWS_ROOT env → --root CLI arg → cwd.
//
// No auth. Stdio transport assumes a local trust boundary — sessions without
// a local clone (mobile/web) can't reach this MCP and fall back to gh api.

import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 2 KB caps the raw model output we hand back. The committed NDJSON keeps
// the full text — drillers point at it via `<file>:<line>` instead.
const RAW_TRUNCATE_BYTES = 2048;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 50;
const DEFAULT_HEALTH_DAYS = 7;
// Article trace can fan out to hundreds of events across re-runs; cap to
// keep tool output well under the typical context budget.
const ARTICLE_TRACE_HARD_LIMIT = 500;

// ---- Types from the on-disk NDJSON shape -----------------------------------

export interface IndexRow {
  schema_version?: number;
  run_id?: string;
  stage?: string;
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  git_sha?: string;
  dry_run?: boolean;
  summary?: Record<string, unknown>;
  file?: string;
}

export interface NdjsonEvent {
  schema_version?: number;
  run_id?: string;
  stage?: string;
  ts?: string;
  event?: string;
  [key: string]: unknown;
}

// ---- Tool arg shapes -------------------------------------------------------

export interface ListRunsArgs {
  stage?: string;
  since?: string;
  until?: string;
  git_sha?: string;
  limit?: number;
}

export interface GetRunArgs {
  run_id: string;
}

export interface QueryFailuresArgs {
  failure_code?: string;
  stage?: string;
  since?: string;
  until?: string;
  article_id?: string;
  limit?: number;
}

export interface GetArticleTraceArgs {
  article_id: string;
  limit?: number;
}

export interface RecentHealthArgs {
  days?: number;
}

export interface CompareRunsArgs {
  run_id_a: string;
  run_id_b: string;
}

export interface DedupHistogramArgs {
  since?: string;
  until?: string;
  days?: number;
}

export interface DedupHistogramBucket {
  range: string;
  count: number;
  sample_titles: string[];
}

export interface DedupHistogram {
  generated_at: string;
  window_days: number | null;
  total_decisions: number;
  duplicate_count: number;
  unique_count: number;
  reason_breakdown: Record<string, number>;
  /** One bucket per 10-point score band. Only buckets with ≥1 event are included. */
  score_buckets: DedupHistogramBucket[];
}

// ---- Repo root resolution --------------------------------------------------

export function resolveRoot(
  env: NodeJS.ProcessEnv,
  argv: readonly string[],
  cwd: string,
): string {
  const fromEnv = env.CYBER_NEWS_ROOT;
  if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--root" && i + 1 < argv.length) {
      const v = argv[i + 1];
      if (typeof v === "string" && v.length > 0) return v;
    }
    const m = /^--root=(.+)$/.exec(argv[i] ?? "");
    if (m && m[1]) return m[1];
  }
  return cwd;
}

// ---- NDJSON streaming + truncation -----------------------------------------

async function* readNdjson<T>(file: string): AsyncIterable<{ row: T; line: number }> {
  const rl = createInterface({
    input: createReadStream(file, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });
  let lineNo = 0;
  for await (const raw of rl) {
    lineNo++;
    const t = raw.trim();
    if (!t) continue;
    try {
      yield { row: JSON.parse(t) as T, line: lineNo };
    } catch {
      // Malformed line — skip silently. A tool that crashes on a single
      // garbled write would be worse than missing one event.
    }
  }
}

function truncateRaw(
  event: NdjsonEvent,
  file: string,
  line: number,
): NdjsonEvent {
  let out: NdjsonEvent | null = null;
  for (const key of ["raw_output", "raw_model_output"] as const) {
    const v = event[key];
    if (typeof v !== "string") continue;
    if (Buffer.byteLength(v, "utf8") <= RAW_TRUNCATE_BYTES) continue;
    if (!out) out = { ...event };
    out[key] =
      v.slice(0, RAW_TRUNCATE_BYTES) +
      `\n...truncated, full at ${file}:${line}`;
  }
  return out ?? event;
}

// ---- Predicate helpers -----------------------------------------------------

function inWindow(iso: string | undefined, since?: string, until?: string): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  if (since) {
    const s = Date.parse(since);
    if (Number.isFinite(s) && t < s) return false;
  }
  if (until) {
    const u = Date.parse(until);
    if (Number.isFinite(u) && t > u) return false;
  }
  return true;
}

// ---- Tool: runlog_list_runs ------------------------------------------------

export async function listRuns(
  args: ListRunsArgs,
  opts: { root: string },
): Promise<IndexRow[]> {
  const indexPath = path.join(opts.root, "logs", "runs", "INDEX.ndjson");
  if (!existsSync(indexPath)) return [];
  const limit = clampLimit(args.limit, DEFAULT_LIMIT);
  const out: IndexRow[] = [];
  for await (const { row } of readNdjson<IndexRow>(indexPath)) {
    if (args.stage && row.stage !== args.stage) continue;
    if (args.git_sha && row.git_sha !== args.git_sha) continue;
    if ((args.since || args.until) && !inWindow(row.started_at, args.since, args.until)) {
      continue;
    }
    out.push(row);
  }
  // Newest first — most queries want recent runs.
  out.sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? ""));
  return out.slice(0, limit);
}

// ---- Tool: runlog_get_run --------------------------------------------------

export interface GetRunResult {
  run: IndexRow | null;
  events: NdjsonEvent[];
  summary: Record<string, unknown> | null;
  /** True iff the per-run NDJSON file referenced by INDEX is missing. */
  file_missing?: boolean;
}

export async function getRun(
  args: GetRunArgs,
  opts: { root: string },
): Promise<GetRunResult> {
  const indexPath = path.join(opts.root, "logs", "runs", "INDEX.ndjson");
  let run: IndexRow | null = null;
  if (existsSync(indexPath)) {
    for await (const { row } of readNdjson<IndexRow>(indexPath)) {
      if (row.run_id === args.run_id) {
        run = row;
        break;
      }
    }
  }
  if (!run || !run.file) {
    return { run, events: [], summary: null };
  }
  const filePath = path.join(opts.root, run.file);
  if (!existsSync(filePath)) {
    return { run, events: [], summary: null, file_missing: true };
  }
  const events: NdjsonEvent[] = [];
  let summary: Record<string, unknown> | null = null;
  for await (const { row, line } of readNdjson<NdjsonEvent>(filePath)) {
    if (row.event === "run_summary" && row.summary && typeof row.summary === "object") {
      summary = row.summary as Record<string, unknown>;
    }
    events.push(truncateRaw(row, run.file, line));
  }
  return { run, events, summary };
}

// ---- Tool: runlog_query_failures ------------------------------------------

const FAILURE_EVENTS = new Set([
  "triage_rejected",
  "factcheck_failed",
  "article_error",
  "pattern_parse_error",
]);

export async function queryFailures(
  args: QueryFailuresArgs,
  opts: { root: string },
): Promise<NdjsonEvent[]> {
  const indexPath = path.join(opts.root, "logs", "runs", "INDEX.ndjson");
  if (!existsSync(indexPath)) return [];
  const limit = clampLimit(args.limit, DEFAULT_LIMIT);
  const indexRows: IndexRow[] = [];
  for await (const { row } of readNdjson<IndexRow>(indexPath)) {
    if (args.stage && row.stage !== args.stage) continue;
    if ((args.since || args.until) && !inWindow(row.started_at, args.since, args.until)) continue;
    indexRows.push(row);
  }
  // Walk newest first so that early-termination at `limit` returns recent
  // failures rather than ancient ones.
  indexRows.sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? ""));

  const out: NdjsonEvent[] = [];
  for (const idx of indexRows) {
    if (!idx.file) continue;
    const filePath = path.join(opts.root, idx.file);
    if (!existsSync(filePath)) continue;
    for await (const { row, line } of readNdjson<NdjsonEvent>(filePath)) {
      if (typeof row.event !== "string" || !FAILURE_EVENTS.has(row.event)) continue;
      if (args.failure_code && row.failure_code !== args.failure_code) continue;
      if (args.article_id && row.article_id !== args.article_id) continue;
      out.push(truncateRaw(row, idx.file, line));
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ---- Tool: runlog_get_article_trace ---------------------------------------

export async function getArticleTrace(
  args: GetArticleTraceArgs,
  opts: { root: string },
): Promise<NdjsonEvent[]> {
  const indexPath = path.join(opts.root, "logs", "runs", "INDEX.ndjson");
  if (!existsSync(indexPath)) return [];
  const limit = clampLimit(args.limit, ARTICLE_TRACE_HARD_LIMIT, ARTICLE_TRACE_HARD_LIMIT);
  const indexRows: IndexRow[] = [];
  for await (const { row } of readNdjson<IndexRow>(indexPath)) {
    indexRows.push(row);
  }
  // Oldest first — a per-article trace reads chronologically.
  indexRows.sort((a, b) => (a.started_at ?? "").localeCompare(b.started_at ?? ""));

  const out: NdjsonEvent[] = [];
  for (const idx of indexRows) {
    if (!idx.file) continue;
    const filePath = path.join(opts.root, idx.file);
    if (!existsSync(filePath)) continue;
    for await (const { row, line } of readNdjson<NdjsonEvent>(filePath)) {
      if (row.article_id !== args.article_id) continue;
      out.push(truncateRaw(row, idx.file, line));
      if (out.length >= limit) return out;
    }
  }
  return out;
}

// ---- Tool: runlog_recent_health -------------------------------------------

export interface RecentHealth {
  window_days: number;
  generated_at: string;
  runs: number;
  runs_by_stage: Record<string, number>;
  articles_processed: number;
  published: number;
  total_cost_usd: number;
  failure_breakdown: Record<string, number>;
  top_failing_sources: Array<{ source_id: string; failure_count: number }>;
}

export async function recentHealth(
  args: RecentHealthArgs,
  opts: { root: string; now?: () => Date },
): Promise<RecentHealth> {
  const days = typeof args.days === "number" && args.days > 0 ? args.days : DEFAULT_HEALTH_DAYS;
  const now = (opts.now ?? (() => new Date()))();
  const cutoff = now.getTime() - days * DAY_MS;
  const indexPath = path.join(opts.root, "logs", "runs", "INDEX.ndjson");

  const empty: RecentHealth = {
    window_days: days,
    generated_at: now.toISOString(),
    runs: 0,
    runs_by_stage: {},
    articles_processed: 0,
    published: 0,
    total_cost_usd: 0,
    failure_breakdown: {},
    top_failing_sources: [],
  };
  if (!existsSync(indexPath)) return empty;

  const rows: IndexRow[] = [];
  for await (const { row } of readNdjson<IndexRow>(indexPath)) {
    if (!row.started_at) continue;
    const t = Date.parse(row.started_at);
    if (!Number.isFinite(t) || t < cutoff) continue;
    rows.push(row);
  }
  if (rows.length === 0) return empty;

  const runsByStage: Record<string, number> = {};
  let articlesProcessed = 0;
  let published = 0;
  let totalCost = 0;
  for (const r of rows) {
    const stage = r.stage ?? "unknown";
    runsByStage[stage] = (runsByStage[stage] ?? 0) + 1;
    const s = r.summary;
    if (!s) continue;
    articlesProcessed += num(s.processed);
    published += num(s.published);
    const costs = asObj(s.costs);
    if (!costs) continue;
    const total = asObj(costs.total);
    if (total) totalCost += num(total.cost_usd);
  }

  const failureBreakdown: Record<string, number> = {};
  const failuresBySource: Record<string, number> = {};
  for (const r of rows) {
    if (!r.file) continue;
    const filePath = path.join(opts.root, r.file);
    if (!existsSync(filePath)) continue;
    for await (const { row } of readNdjson<NdjsonEvent>(filePath)) {
      if (row.event !== "article_done") continue;
      if (row.terminal_state === "published") continue;
      const code = typeof row.failure_code === "string" ? row.failure_code : "unknown";
      failureBreakdown[code] = (failureBreakdown[code] ?? 0) + 1;
      const src =
        typeof row.source_id === "string" && row.source_id.length > 0
          ? row.source_id
          : "unknown";
      failuresBySource[src] = (failuresBySource[src] ?? 0) + 1;
    }
  }

  const topFailing = Object.entries(failuresBySource)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([source_id, failure_count]) => ({ source_id, failure_count }));

  return {
    window_days: days,
    generated_at: now.toISOString(),
    runs: rows.length,
    runs_by_stage: runsByStage,
    articles_processed: articlesProcessed,
    published,
    total_cost_usd: totalCost,
    failure_breakdown: failureBreakdown,
    top_failing_sources: topFailing,
  };
}

// ---- Tool: runlog_compare_runs --------------------------------------------

export interface RunDiff {
  a: IndexRow | null;
  b: IndexRow | null;
  /** b - a for the standard counters; null if either side is missing. */
  delta: {
    duration_ms: number;
    processed: number;
    published: number;
    triage_rejected: number;
    factcheck_failed: number;
    total_cost_usd: number;
  } | null;
}

export async function compareRuns(
  args: CompareRunsArgs,
  opts: { root: string },
): Promise<RunDiff> {
  const indexPath = path.join(opts.root, "logs", "runs", "INDEX.ndjson");
  let a: IndexRow | null = null;
  let b: IndexRow | null = null;
  if (existsSync(indexPath)) {
    for await (const { row } of readNdjson<IndexRow>(indexPath)) {
      if (row.run_id === args.run_id_a) a = row;
      if (row.run_id === args.run_id_b) b = row;
      if (a && b) break;
    }
  }
  if (!a || !b) return { a, b, delta: null };
  const aS = a.summary ?? {};
  const bS = b.summary ?? {};
  const aTotal = asObj(asObj(aS.costs)?.total) ?? {};
  const bTotal = asObj(asObj(bS.costs)?.total) ?? {};
  return {
    a,
    b,
    delta: {
      duration_ms: num(b.duration_ms) - num(a.duration_ms),
      processed: num(bS.processed) - num(aS.processed),
      published: num(bS.published) - num(aS.published),
      triage_rejected: num(bS.triage_rejected) - num(aS.triage_rejected),
      factcheck_failed: num(bS.factcheck_failed) - num(aS.factcheck_failed),
      total_cost_usd: num(bTotal.cost_usd) - num(aTotal.cost_usd),
    },
  };
}

// ---- Tool: runlog_dedup_histogram ------------------------------------------

const SAMPLE_TITLE_LIMIT = 3;
const BUCKET_WIDTH = 10;

function scoreBucketLabel(score: number): string {
  const lo = Math.floor(score / BUCKET_WIDTH) * BUCKET_WIDTH;
  const hi = lo + BUCKET_WIDTH - 1;
  // Cap the upper end of the last bucket at 100.
  return `${lo}-${Math.min(hi, 100)}`;
}

export async function dedupHistogram(
  args: DedupHistogramArgs,
  opts: { root: string; now?: () => Date },
): Promise<DedupHistogram> {
  const now = (opts.now ?? (() => new Date()))();
  const generated_at = now.toISOString();

  // Resolve time window: prefer explicit since/until, fall back to days.
  let since: string | undefined = args.since;
  let until: string | undefined = args.until;
  let windowDays: number | null = null;
  if (!since && !until && typeof args.days === "number" && args.days > 0) {
    windowDays = args.days;
    since = new Date(now.getTime() - windowDays * DAY_MS).toISOString();
  }

  const indexPath = path.join(opts.root, "logs", "runs", "INDEX.ndjson");
  const empty: DedupHistogram = {
    generated_at,
    window_days: windowDays,
    total_decisions: 0,
    duplicate_count: 0,
    unique_count: 0,
    reason_breakdown: {},
    score_buckets: [],
  };
  if (!existsSync(indexPath)) return empty;

  // Collect ingest runs within the window.
  const rows: IndexRow[] = [];
  for await (const { row } of readNdjson<IndexRow>(indexPath)) {
    if (row.stage !== "ingest") continue;
    if ((since || until) && !inWindow(row.started_at, since, until)) continue;
    rows.push(row);
  }
  if (rows.length === 0) return empty;

  let totalDecisions = 0;
  let duplicateCount = 0;
  let uniqueCount = 0;
  const reasonBreakdown: Record<string, number> = {};
  // bucket label → { count, sample_titles }
  const buckets = new Map<string, { count: number; sample_titles: string[] }>();

  for (const idx of rows) {
    if (!idx.file) continue;
    const filePath = path.join(opts.root, idx.file);
    if (!existsSync(filePath)) continue;
    for await (const { row } of readNdjson<NdjsonEvent>(filePath)) {
      if (row.event !== "dedup_decision") continue;
      totalDecisions++;

      const decision = typeof row.decision === "string" ? row.decision : "unknown";
      if (decision === "duplicate") duplicateCount++;
      else if (decision === "unique") uniqueCount++;

      const reason = typeof row.reason === "string" ? row.reason : "unknown";
      reasonBreakdown[reason] = (reasonBreakdown[reason] ?? 0) + 1;

      // Extract the top_match score for histogram bucketing.
      const topMatch = row.top_match as Record<string, unknown> | null | undefined;
      const score =
        topMatch && typeof topMatch.score === "number" && Number.isFinite(topMatch.score)
          ? topMatch.score
          : null;
      if (score === null) continue;

      const label = scoreBucketLabel(score);
      let bucket = buckets.get(label);
      if (!bucket) {
        bucket = { count: 0, sample_titles: [] };
        buckets.set(label, bucket);
      }
      bucket.count++;
      const candidate = row.candidate as Record<string, unknown> | null | undefined;
      const title =
        candidate && typeof candidate.title === "string" ? candidate.title : null;
      if (title && bucket.sample_titles.length < SAMPLE_TITLE_LIMIT) {
        bucket.sample_titles.push(title);
      }
    }
  }

  // Sort buckets by lower bound ascending.
  const scoreBuckets: DedupHistogramBucket[] = Array.from(buckets.entries())
    .sort((a, b) => {
      const aLo = parseInt(a[0].split("-")[0]!, 10);
      const bLo = parseInt(b[0].split("-")[0]!, 10);
      return aLo - bLo;
    })
    .map(([range, { count, sample_titles }]) => ({ range, count, sample_titles }));

  return {
    generated_at,
    window_days: windowDays,
    total_decisions: totalDecisions,
    duplicate_count: duplicateCount,
    unique_count: uniqueCount,
    reason_breakdown: reasonBreakdown,
    score_buckets: scoreBuckets,
  };
}

// ---- Type guards / utility -------------------------------------------------

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function clampLimit(v: unknown, fallback: number, max = 1000): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(Math.floor(v), max);
}

function requireString(v: unknown, name: string): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`argument '${name}' must be a non-empty string`);
  }
  return v;
}

function optionalString(v: unknown, name: string): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") throw new Error(`argument '${name}' must be a string`);
  return v;
}

function optionalNumber(v: unknown, name: string): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`argument '${name}' must be a number`);
  }
  return v;
}

// ---- Server bootstrap ------------------------------------------------------

const TOOL_DEFINITIONS = [
  {
    name: "runlog_list_runs",
    description:
      "List run digests from logs/runs/INDEX.ndjson. Returns INDEX rows " +
      "filtered by stage/git_sha/started_at window, newest first.",
    inputSchema: {
      type: "object",
      properties: {
        stage: { type: "string", description: "process | ingest | investigate" },
        since: { type: "string", description: "ISO timestamp; rows started_at >= since" },
        until: { type: "string", description: "ISO timestamp; rows started_at <= until" },
        git_sha: { type: "string" },
        limit: { type: "number", description: "Default 50, max 1000" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "runlog_get_run",
    description:
      "Fetch the full NDJSON event stream for a run by run_id. raw_output " +
      "and raw_model_output are truncated to 2 KB with a `<file>:<line>` " +
      "pointer to the committed full text.",
    inputSchema: {
      type: "object",
      properties: { run_id: { type: "string" } },
      required: ["run_id"],
      additionalProperties: false,
    },
  },
  {
    name: "runlog_query_failures",
    description:
      "Search dedicated failure events (triage_rejected, factcheck_failed, " +
      "article_error, pattern_parse_error) across runs. Newest first.",
    inputSchema: {
      type: "object",
      properties: {
        failure_code: { type: "string" },
        stage: { type: "string" },
        since: { type: "string" },
        until: { type: "string" },
        article_id: { type: "string" },
        limit: { type: "number", description: "Default 50, max 1000" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "runlog_get_article_trace",
    description:
      "Return every NDJSON event tagged with the given article_id, in " +
      "chronological order across runs.",
    inputSchema: {
      type: "object",
      properties: {
        article_id: { type: "string" },
        limit: { type: "number", description: `Default ${ARTICLE_TRACE_HARD_LIMIT}` },
      },
      required: ["article_id"],
      additionalProperties: false,
    },
  },
  {
    name: "runlog_recent_health",
    description:
      "Aggregate the last N days of INDEX rows + article_done events into " +
      "a health snapshot: counts, cost, failure breakdown, top failing sources.",
    inputSchema: {
      type: "object",
      properties: { days: { type: "number", description: "Default 7" } },
      additionalProperties: false,
    },
  },
  {
    name: "runlog_compare_runs",
    description:
      "Diff two runs' INDEX summaries. Returns both rows plus b-minus-a " +
      "deltas for processed/published/cost/etc.",
    inputSchema: {
      type: "object",
      properties: {
        run_id_a: { type: "string" },
        run_id_b: { type: "string" },
      },
      required: ["run_id_a", "run_id_b"],
      additionalProperties: false,
    },
  },
  {
    name: "runlog_dedup_histogram",
    description:
      "Scan dedup_decision events across ingest runs in a time window and " +
      "return score-bucket counts plus sample candidate titles. Useful for " +
      "sizing the dedup threshold and evaluating near-miss rates. " +
      "Specify a window with days (e.g. days=1) or explicit since/until timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        since: { type: "string", description: "ISO timestamp; inclusive lower bound" },
        until: { type: "string", description: "ISO timestamp; inclusive upper bound" },
        days: { type: "number", description: "Rolling window in days (e.g. 1 for last 24h)" },
      },
      additionalProperties: false,
    },
  },
] as const;

export function buildServer(opts: { root: string }): Server {
  const server = new Server(
    { name: "cyber-news-runlog", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name;
    const args = (req.params.arguments ?? {}) as Record<string, unknown>;
    try {
      const result = await dispatch(name, args, opts);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `runlog tool error: ${msg}` }],
      };
    }
  });

  return server;
}

async function dispatch(
  name: string,
  args: Record<string, unknown>,
  opts: { root: string },
): Promise<unknown> {
  switch (name) {
    case "runlog_list_runs":
      return listRuns(
        {
          stage: optionalString(args.stage, "stage"),
          since: optionalString(args.since, "since"),
          until: optionalString(args.until, "until"),
          git_sha: optionalString(args.git_sha, "git_sha"),
          limit: optionalNumber(args.limit, "limit"),
        },
        opts,
      );
    case "runlog_get_run":
      return getRun({ run_id: requireString(args.run_id, "run_id") }, opts);
    case "runlog_query_failures":
      return queryFailures(
        {
          failure_code: optionalString(args.failure_code, "failure_code"),
          stage: optionalString(args.stage, "stage"),
          since: optionalString(args.since, "since"),
          until: optionalString(args.until, "until"),
          article_id: optionalString(args.article_id, "article_id"),
          limit: optionalNumber(args.limit, "limit"),
        },
        opts,
      );
    case "runlog_get_article_trace":
      return getArticleTrace(
        {
          article_id: requireString(args.article_id, "article_id"),
          limit: optionalNumber(args.limit, "limit"),
        },
        opts,
      );
    case "runlog_recent_health":
      return recentHealth({ days: optionalNumber(args.days, "days") }, opts);
    case "runlog_compare_runs":
      return compareRuns(
        {
          run_id_a: requireString(args.run_id_a, "run_id_a"),
          run_id_b: requireString(args.run_id_b, "run_id_b"),
        },
        opts,
      );
    case "runlog_dedup_histogram":
      return dedupHistogram(
        {
          since: optionalString(args.since, "since"),
          until: optionalString(args.until, "until"),
          days: optionalNumber(args.days, "days"),
        },
        opts,
      );
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

async function main(): Promise<void> {
  const root = resolveRoot(process.env, process.argv.slice(2), process.cwd());
  const server = buildServer({ root });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    // stderr only — stdout is the MCP transport channel.
    process.stderr.write(
      JSON.stringify({
        mcp_run_log: "fatal",
        error: err instanceof Error ? err.message : String(err),
      }) + "\n",
    );
    process.exit(1);
  });
}
