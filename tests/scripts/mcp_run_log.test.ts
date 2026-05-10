import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  compareRuns,
  getArticleTrace,
  getRun,
  listRuns,
  queryFailures,
  recentHealth,
  resolveRoot,
  type IndexRow,
} from "../../scripts/mcp_run_log.ts";

// Committed canonical fixture root. Mirrors the on-disk shape of real
// logs/runs/{date}/process-*.ndjson so tests stay aligned with reality.
const FIXTURE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "run_logs",
);

const FIXED_NOW = () => new Date("2026-05-10T12:00:00Z");

// ---------------------------------------------------------------------------
// Repo-root resolution
// ---------------------------------------------------------------------------

describe("resolveRoot", () => {
  it("prefers CYBER_NEWS_ROOT env var over --root and cwd", () => {
    const root = resolveRoot(
      { CYBER_NEWS_ROOT: "/from-env" },
      ["--root", "/from-arg"],
      "/from-cwd",
    );
    assert.equal(root, "/from-env");
  });

  it("falls back to --root when env is unset", () => {
    const root = resolveRoot({}, ["--root", "/from-arg"], "/from-cwd");
    assert.equal(root, "/from-arg");
  });

  it("supports --root=<path> form", () => {
    const root = resolveRoot({}, ["--root=/from-arg"], "/from-cwd");
    assert.equal(root, "/from-arg");
  });

  it("falls back to cwd when neither env nor arg is set", () => {
    const root = resolveRoot({}, [], "/from-cwd");
    assert.equal(root, "/from-cwd");
  });

  it("treats empty CYBER_NEWS_ROOT as unset", () => {
    const root = resolveRoot({ CYBER_NEWS_ROOT: "" }, ["--root=/from-arg"], "/cwd");
    assert.equal(root, "/from-arg");
  });
});

// ---------------------------------------------------------------------------
// Tools against the committed fixture
// ---------------------------------------------------------------------------

describe("listRuns (fixture)", () => {
  it("returns all 4 runs newest first when no filter is given", async () => {
    const out = await listRuns({}, { root: FIXTURE_ROOT });
    assert.equal(out.length, 4);
    assert.deepEqual(
      out.map((r) => r.run_id),
      ["dddddddd", "cccccccc", "bbbbbbbb", "aaaaaaaa"],
    );
  });

  it("filters by stage", async () => {
    const out = await listRuns({ stage: "ingest" }, { root: FIXTURE_ROOT });
    assert.equal(out.length, 1);
    assert.equal(out[0]!.run_id, "cccccccc");
  });

  it("filters by git_sha", async () => {
    const out = await listRuns({ git_sha: "betaSha" }, { root: FIXTURE_ROOT });
    assert.equal(out.length, 2);
    assert.deepEqual(
      new Set(out.map((r) => r.run_id)),
      new Set(["bbbbbbbb", "cccccccc"]),
    );
  });

  it("filters by since/until window", async () => {
    const out = await listRuns(
      { since: "2026-05-09T00:00:00Z", until: "2026-05-09T23:59:59Z" },
      { root: FIXTURE_ROOT },
    );
    assert.deepEqual(
      new Set(out.map((r) => r.run_id)),
      new Set(["bbbbbbbb", "cccccccc"]),
    );
  });

  it("respects the limit arg", async () => {
    const out = await listRuns({ limit: 2 }, { root: FIXTURE_ROOT });
    assert.equal(out.length, 2);
  });
});

describe("getRun (fixture)", () => {
  it("returns the indexed row, full event stream, and parsed summary", async () => {
    const out = await getRun({ run_id: "aaaaaaaa" }, { root: FIXTURE_ROOT });
    assert.equal(out.run?.run_id, "aaaaaaaa");
    assert.equal(out.summary?.processed, 2);
    // run_start, 3 model_calls, 1 article_done (art-1), 1 triage_rejected,
    // 1 article_done (art-2), 1 run_summary = 8 events
    assert.equal(out.events.length, 8);
    const events = out.events.map((e) => e.event);
    assert.ok(events.includes("run_start"));
    assert.ok(events.includes("run_summary"));
    assert.ok(events.includes("triage_rejected"));
  });

  it("truncates raw_output > 2 KB and embeds a `<file>:<line>` pointer", async () => {
    const out = await getRun({ run_id: "aaaaaaaa" }, { root: FIXTURE_ROOT });
    const big = out.events.find(
      (e) =>
        e.event === "model_call" &&
        typeof e.raw_output === "string" &&
        e.raw_output.includes("...truncated"),
    );
    assert.ok(big, "expected one model_call to have been truncated");
    const raw = big!.raw_output as string;
    // Truncation keeps the leading marker but drops the trailing one.
    assert.match(raw, /BIG_RAW_OUTPUT_MARKER_START_/);
    assert.doesNotMatch(raw, /BIG_RAW_OUTPUT_MARKER_END/);
    assert.match(raw, /\.\.\.truncated, full at logs\/runs\/2026-05-08\/process-aaaaaaaa\.ndjson:5/);
  });

  it("leaves short raw_output untouched", async () => {
    const out = await getRun({ run_id: "aaaaaaaa" }, { root: FIXTURE_ROOT });
    const small = out.events.find(
      (e) => e.event === "model_call" && (e.raw_output as string)?.includes("decision"),
    );
    assert.ok(small);
    assert.doesNotMatch(small!.raw_output as string, /\.\.\.truncated/);
  });

  it("returns nulls when run_id is unknown", async () => {
    const out = await getRun({ run_id: "ffffffff" }, { root: FIXTURE_ROOT });
    assert.equal(out.run, null);
    assert.equal(out.summary, null);
    assert.equal(out.events.length, 0);
  });

  it("skips malformed NDJSON lines without throwing", async () => {
    // process-bbbbbbbb.ndjson has a deliberately bad line.
    const out = await getRun({ run_id: "bbbbbbbb" }, { root: FIXTURE_ROOT });
    assert.equal(out.run?.run_id, "bbbbbbbb");
    // run_start, 1 model_call, 3 article_done, 1 factcheck_failed, run_summary = 7
    assert.equal(out.events.length, 7);
    assert.equal(out.summary?.factcheck_failed, 1);
  });
});

describe("queryFailures (fixture)", () => {
  it("returns dedicated failure events across runs, newest first", async () => {
    const out = await queryFailures({}, { root: FIXTURE_ROOT });
    // 1 factcheck_failed (bbbbbbbb) + 1 triage_rejected (aaaaaaaa)
    assert.equal(out.length, 2);
    assert.equal(out[0]!.event, "factcheck_failed");
    assert.equal(out[1]!.event, "triage_rejected");
  });

  it("filters by failure_code", async () => {
    const out = await queryFailures(
      { failure_code: "triage_vendor_marketing" },
      { root: FIXTURE_ROOT },
    );
    assert.equal(out.length, 1);
    assert.equal(out[0]!.article_id, "art-2");
  });

  it("filters by article_id", async () => {
    const out = await queryFailures({ article_id: "art-5" }, { root: FIXTURE_ROOT });
    assert.equal(out.length, 1);
    assert.equal(out[0]!.failure_code, "factcheck_invalid_cve");
  });

  it("excludes article_done events even on failure terminals", async () => {
    const out = await queryFailures({}, { root: FIXTURE_ROOT });
    assert.ok(out.every((e) => e.event !== "article_done"));
  });
});

describe("getArticleTrace (fixture)", () => {
  it("returns every event for an article in chronological order across runs", async () => {
    // art-2 appears in both aaaaaaaa (rejected) and bbbbbbbb (re-processed).
    const out = await getArticleTrace({ article_id: "art-2" }, { root: FIXTURE_ROOT });
    assert.ok(out.length >= 3, "expected events from both runs");
    const runs = new Set(out.map((e) => e.run_id));
    assert.deepEqual(runs, new Set(["aaaaaaaa", "bbbbbbbb"]));
    // Earlier run's events come first.
    const firstAaaaIdx = out.findIndex((e) => e.run_id === "aaaaaaaa");
    const firstBbbbIdx = out.findIndex((e) => e.run_id === "bbbbbbbb");
    assert.ok(firstAaaaIdx >= 0 && firstBbbbIdx > firstAaaaIdx);
  });

  it("returns empty for an unknown article_id", async () => {
    const out = await getArticleTrace({ article_id: "missing" }, { root: FIXTURE_ROOT });
    assert.equal(out.length, 0);
  });
});

describe("recentHealth (fixture)", () => {
  it("aggregates the 7-day window: counts, costs, failures, top sources", async () => {
    const h = await recentHealth({ days: 7 }, { root: FIXTURE_ROOT, now: FIXED_NOW });
    assert.equal(h.window_days, 7);
    assert.equal(h.runs, 4);
    assert.deepEqual(h.runs_by_stage, { process: 3, ingest: 1 });
    // processed: 2 + 3 + 0 (ingest) + 2 = 7
    assert.equal(h.articles_processed, 7);
    // published: 1 + 2 + 0 + 2 = 5
    assert.equal(h.published, 5);
    // total cost: 0.014 + 0.042 + 0.024 = 0.08
    assert.ok(Math.abs(h.total_cost_usd - 0.08) < 1e-9, `got ${h.total_cost_usd}`);
    // failures: 1 triage_vendor_marketing + 1 factcheck_invalid_cve
    assert.deepEqual(h.failure_breakdown, {
      triage_vendor_marketing: 1,
      factcheck_invalid_cve: 1,
    });
    // top failing sources, excluding published terminals
    const srcCounts = Object.fromEntries(
      h.top_failing_sources.map((s) => [s.source_id, s.failure_count]),
    );
    assert.deepEqual(srcCounts, { "vendor-blog": 1, newswire: 1 });
  });

  it("narrows when days=0.5 (only 2026-05-10 process run is in window)", async () => {
    // FIXED_NOW = 2026-05-10T12:00Z; cutoff = 2026-05-10T00:00Z.
    const h = await recentHealth({ days: 0.5 }, { root: FIXTURE_ROOT, now: FIXED_NOW });
    assert.equal(h.runs, 1);
    assert.equal(h.runs_by_stage.process, 1);
    assert.equal(Object.keys(h.failure_breakdown).length, 0);
  });
});

describe("compareRuns (fixture)", () => {
  it("computes b - a deltas for matching runs", async () => {
    const d = await compareRuns(
      { run_id_a: "aaaaaaaa", run_id_b: "bbbbbbbb" },
      { root: FIXTURE_ROOT },
    );
    assert.ok(d.delta);
    assert.equal(d.delta!.processed, 1); // 3 - 2
    assert.equal(d.delta!.published, 1); // 2 - 1
    assert.equal(d.delta!.triage_rejected, -1); // 0 - 1
    assert.equal(d.delta!.factcheck_failed, 1); // 1 - 0
    assert.ok(
      Math.abs(d.delta!.total_cost_usd - 0.028) < 1e-9,
      `unexpected delta cost ${d.delta!.total_cost_usd}`,
    );
    assert.equal(d.delta!.duration_ms, 28000); // 70000 - 42000
  });

  it("returns null delta when one side is missing", async () => {
    const d = await compareRuns(
      { run_id_a: "aaaaaaaa", run_id_b: "ffffffff" },
      { root: FIXTURE_ROOT },
    );
    assert.equal(d.b, null);
    assert.equal(d.delta, null);
  });
});

// ---------------------------------------------------------------------------
// Edge cases against synthesized temp dirs
// ---------------------------------------------------------------------------

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(path.join(tmpdir(), "mcp-run-log-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

function writeIndex(rows: unknown[]): void {
  const dir = path.join(tmpRoot, "logs", "runs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "INDEX.ndjson"),
    rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length > 0 ? "\n" : ""),
  );
}

describe("edge cases", () => {
  it("listRuns returns [] when INDEX.ndjson is missing", async () => {
    const out = await listRuns({}, { root: tmpRoot });
    assert.deepEqual(out, []);
  });

  it("listRuns returns [] when INDEX.ndjson is empty", async () => {
    writeIndex([]);
    const out = await listRuns({}, { root: tmpRoot });
    assert.deepEqual(out, []);
  });

  it("getRun signals file_missing when the per-run NDJSON file was deleted", async () => {
    const row: IndexRow = {
      schema_version: 1,
      run_id: "ghost",
      stage: "process",
      started_at: "2026-05-09T18:30:00Z",
      finished_at: "2026-05-09T18:30:30Z",
      duration_ms: 30000,
      git_sha: "ghost",
      dry_run: false,
      summary: { processed: 1, published: 1 },
      file: "logs/runs/2026-05-09/process-ghost.ndjson",
    };
    writeIndex([row]);
    const out = await getRun({ run_id: "ghost" }, { root: tmpRoot });
    assert.equal(out.run?.run_id, "ghost");
    assert.equal(out.file_missing, true);
    assert.deepEqual(out.events, []);
  });

  it("recentHealth returns the empty shape on missing INDEX", async () => {
    const h = await recentHealth({ days: 7 }, { root: tmpRoot, now: FIXED_NOW });
    assert.equal(h.runs, 0);
    assert.deepEqual(h.failure_breakdown, {});
    assert.deepEqual(h.top_failing_sources, []);
  });

  it("queryFailures skips rows whose per-run file is missing", async () => {
    const row: IndexRow = {
      schema_version: 1,
      run_id: "ghost",
      stage: "process",
      started_at: "2026-05-09T18:30:00Z",
      finished_at: "2026-05-09T18:30:30Z",
      duration_ms: 30000,
      git_sha: "ghost",
      dry_run: false,
      summary: { processed: 1, published: 1 },
      file: "logs/runs/2026-05-09/process-ghost.ndjson",
    };
    writeIndex([row]);
    const out = await queryFailures({}, { root: tmpRoot });
    assert.deepEqual(out, []);
  });
});
