// Reads logs/runs/INDEX.ndjson, filters to the last N days, walks per-run
// NDJSON files for article_done events, and writes a redacted markdown
// summary to stdout. No raw model output, no PII — this file is committed
// to git on every run by .github/workflows/{process,ingest,investigate}.yml.
//
// Aggregations come from two surfaces: INDEX rows (cheap roll-up of cost +
// counts) and per-run NDJSON `article_done` events (per-failure_code +
// per-source breakdowns, since those don't fit in the INDEX digest).
//
// Usage: tsx scripts/gen_run_summary.ts [--days=7] > logs/runs/summary.md
//
// Defensive reads only: INDEX.summary shape varies by stage (process /
// ingest / investigate emit different keys), so missing keys default to
// zero rather than throwing.

import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 7;

interface IndexRow {
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

interface StageRollup {
  calls: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface GenerateSummaryOptions {
  /** Repo root. Defaults to process.cwd(). */
  root?: string;
  /** Window in days. Defaults to 7. */
  days?: number;
  /** Injectable clock (test seam). Defaults to Date. */
  now?: () => Date;
}

/**
 * Build the markdown summary string. Pure-ish: returns the text instead of
 * writing to stdout, which keeps the CLI thin and the unit test trivial.
 */
export async function generateSummary(opts: GenerateSummaryOptions = {}): Promise<string> {
  const root = opts.root ?? process.cwd();
  const days = opts.days ?? DEFAULT_DAYS;
  const now = opts.now ?? (() => new Date());
  const indexPath = path.join(root, "logs", "runs", "INDEX.ndjson");

  if (!existsSync(indexPath) || statSync(indexPath).size === 0) {
    return stub(days, now());
  }

  const cutoffMs = now().getTime() - days * DAY_MS;
  const rows: IndexRow[] = [];
  for await (const row of readNdjson<IndexRow>(indexPath)) {
    if (!row.started_at) continue;
    const t = Date.parse(row.started_at);
    if (!Number.isFinite(t) || t < cutoffMs) continue;
    rows.push(row);
  }

  if (rows.length === 0) return stub(days, now());

  const stageCounts = new Map<string, number>();
  let totalArticlesProcessed = 0;
  let totalArticlesPublished = 0;
  let totalCostUsd = 0;
  const stageCosts = {
    triage: emptyStage(),
    extract: emptyStage(),
    factcheck: emptyStage(),
    total: emptyStage(),
  };

  for (const r of rows) {
    const stage = r.stage ?? "unknown";
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);

    const s = r.summary;
    if (!s) continue;
    totalArticlesProcessed += num(s.processed);
    totalArticlesPublished += num(s.published);

    const costs = asObject(s.costs);
    if (!costs) continue;
    addStage(stageCosts.triage, costs.triage);
    addStage(stageCosts.extract, costs.extract);
    addStage(stageCosts.factcheck, costs.factcheck);
    addStage(stageCosts.total, costs.total);
    const total = asObject(costs.total);
    if (total) totalCostUsd += num(total.cost_usd);
  }

  // article_done is one event per article (PR 3 invariant); failure_code and
  // source_id live there, not on the INDEX digest.
  const failureCounts = new Map<string, number>();
  const failuresBySource = new Map<string, number>();
  for (const r of rows) {
    if (!r.file) continue;
    const filePath = path.join(root, r.file);
    if (!existsSync(filePath)) continue;
    for await (const ev of readNdjson<Record<string, unknown>>(filePath)) {
      if (ev.event !== "article_done") continue;
      if (ev.terminal_state === "published") continue;
      const code = typeof ev.failure_code === "string" ? ev.failure_code : "unknown";
      failureCounts.set(code, (failureCounts.get(code) ?? 0) + 1);
      const src = typeof ev.source_id === "string" && ev.source_id.length > 0 ? ev.source_id : "unknown";
      failuresBySource.set(src, (failuresBySource.get(src) ?? 0) + 1);
    }
  }

  const lines: string[] = [];
  lines.push(`# Run summary — last ${days} days`);
  lines.push("");
  lines.push(`Generated at ${now().toISOString()}.`);
  lines.push("");

  lines.push("## Totals");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---|");
  lines.push(`| Runs | ${rows.length} |`);
  for (const stage of [...stageCounts.keys()].sort()) {
    lines.push(`| Runs (${stage}) | ${stageCounts.get(stage)} |`);
  }
  lines.push(`| Articles processed | ${totalArticlesProcessed} |`);
  lines.push(`| Articles published | ${totalArticlesPublished} |`);
  lines.push(`| Total cost | ${fmtUsd(totalCostUsd)} |`);
  lines.push("");

  lines.push("## Per-stage cost rollup");
  lines.push("");
  lines.push("| Stage | Calls | Input tokens | Output tokens | Cost |");
  lines.push("|---|---:|---:|---:|---:|");
  for (const stage of ["triage", "extract", "factcheck", "total"] as const) {
    const s = stageCosts[stage];
    lines.push(
      `| ${stage} | ${s.calls} | ${s.input_tokens} | ${s.output_tokens} | ${fmtUsd(s.cost_usd)} |`,
    );
  }
  lines.push("");

  lines.push("## Failure breakdown");
  lines.push("");
  if (failureCounts.size === 0) {
    lines.push("_No failures recorded in this window._");
  } else {
    lines.push("| Failure code | Count |");
    lines.push("|---|---:|");
    for (const [code, n] of sortedByCount(failureCounts)) {
      lines.push(`| ${code} | ${n} |`);
    }
  }
  lines.push("");

  lines.push("## Top failing sources");
  lines.push("");
  if (failuresBySource.size === 0) {
    lines.push("_No source-attributed failures in this window._");
  } else {
    lines.push("| Source | Failures |");
    lines.push("|---|---:|");
    for (const [src, n] of sortedByCount(failuresBySource).slice(0, 10)) {
      lines.push(`| ${src} | ${n} |`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

function stub(days: number, when: Date): string {
  return [
    `# Run summary — last ${days} days`,
    "",
    `Generated at ${when.toISOString()}.`,
    "",
    "_No runs recorded yet._",
    "",
  ].join("\n");
}

function emptyStage(): StageRollup {
  return { calls: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0 };
}

function addStage(into: StageRollup, from: unknown): void {
  const f = asObject(from);
  if (!f) return;
  into.calls += num(f.calls);
  into.input_tokens += num(f.input_tokens);
  into.output_tokens += num(f.output_tokens);
  into.cost_usd += num(f.cost_usd);
}

function asObject(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(4)}`;
}

function sortedByCount(map: Map<string, number>): [string, number][] {
  // Sort by count desc, then key asc for deterministic output.
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

async function* readNdjson<T>(file: string): AsyncIterable<T> {
  const rl = createInterface({
    input: createReadStream(file, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const t = line.trim();
    if (!t) continue;
    try {
      yield JSON.parse(t) as T;
    } catch {
      // Skip malformed lines silently — telemetry must never crash the
      // commit step. A line that doesn't parse just doesn't get aggregated.
    }
  }
}

function parseDays(argv: readonly string[]): number {
  for (const a of argv) {
    const m = /^--days=(\d+)$/.exec(a);
    if (m) return Number(m[1]);
  }
  return DEFAULT_DAYS;
}

async function main(): Promise<void> {
  const days = parseDays(process.argv.slice(2));
  const out = await generateSummary({ days });
  process.stdout.write(out);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(
      JSON.stringify({
        gen_run_summary: "fatal",
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    process.exit(1);
  });
}
