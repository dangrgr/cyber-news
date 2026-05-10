import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { generateSummary } from "../../scripts/gen_run_summary.ts";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(path.join(tmpdir(), "gen-run-summary-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

const FIXED_NOW = () => new Date("2026-05-10T12:00:00Z");

function writeRunsIndex(rows: unknown[]): void {
  const dir = path.join(tmpRoot, "logs", "runs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "INDEX.ndjson"),
    rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length > 0 ? "\n" : ""),
  );
}

function writeRunFile(relPath: string, events: unknown[]): void {
  const abs = path.join(tmpRoot, relPath);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, events.map((e) => JSON.stringify(e)).join("\n") + "\n");
}

describe("generateSummary: empty / missing INDEX", () => {
  it("returns the no-runs stub when INDEX.ndjson is missing", async () => {
    const out = await generateSummary({ root: tmpRoot, days: 7, now: FIXED_NOW });
    assert.match(out, /# Run summary — last 7 days/);
    assert.match(out, /No runs recorded yet/);
  });

  it("returns the no-runs stub when INDEX.ndjson is empty", async () => {
    writeRunsIndex([]);
    const out = await generateSummary({ root: tmpRoot, days: 7, now: FIXED_NOW });
    assert.match(out, /No runs recorded yet/);
  });

  it("returns the no-runs stub when every row falls outside the window", async () => {
    writeRunsIndex([
      {
        schema_version: 1,
        run_id: "old",
        stage: "process",
        started_at: "2026-04-01T00:00:00Z",
        finished_at: "2026-04-01T00:00:30Z",
        duration_ms: 30000,
        git_sha: "old",
        dry_run: false,
        summary: { processed: 1, published: 1 },
        file: "logs/runs/2026-04-01/process-old.ndjson",
      },
    ]);
    const out = await generateSummary({ root: tmpRoot, days: 7, now: FIXED_NOW });
    assert.match(out, /No runs recorded yet/);
  });
});

describe("generateSummary: single process run", () => {
  it("aggregates totals, per-stage cost, failure codes, and top failing sources", async () => {
    writeRunsIndex([
      {
        schema_version: 1,
        run_id: "abc12345",
        stage: "process",
        started_at: "2026-05-09T18:30:00Z",
        finished_at: "2026-05-09T18:30:42Z",
        duration_ms: 42000,
        git_sha: "deadbeef",
        dry_run: false,
        summary: {
          processed: 5,
          triage_rejected: 2,
          extracted: 3,
          factcheck_failed: 1,
          published: 2,
          model_calls: 11,
          costs: {
            triage: { calls: 5, input_tokens: 5000, output_tokens: 500, cost_usd: 0.01 },
            extract: { calls: 4, input_tokens: 16000, output_tokens: 2000, cost_usd: 0.04 },
            factcheck: { calls: 2, input_tokens: 4000, output_tokens: 600, cost_usd: 0.012 },
            total: { calls: 11, input_tokens: 25000, output_tokens: 3100, cost_usd: 0.062 },
          },
        },
        file: "logs/runs/2026-05-09/process-abc12345.ndjson",
      },
    ]);

    writeRunFile("logs/runs/2026-05-09/process-abc12345.ndjson", [
      { event: "run_start", run_id: "abc12345" },
      {
        event: "article_done",
        article_id: "a1",
        source_id: "schneier",
        terminal_state: "published",
      },
      {
        event: "article_done",
        article_id: "a2",
        source_id: "schneier",
        terminal_state: "published",
      },
      {
        event: "article_done",
        article_id: "a3",
        source_id: "vendor-blog",
        terminal_state: "triage_rejected",
        failure_code: "triage_vendor_marketing",
      },
      {
        event: "article_done",
        article_id: "a4",
        source_id: "vendor-blog",
        terminal_state: "triage_rejected",
        failure_code: "triage_vendor_marketing",
      },
      {
        event: "article_done",
        article_id: "a5",
        source_id: "newswire",
        terminal_state: "factcheck_failed",
        failure_code: "factcheck_invalid_cve",
      },
    ]);

    const out = await generateSummary({ root: tmpRoot, days: 7, now: FIXED_NOW });

    assert.match(out, /\| Runs \| 1 \|/);
    assert.match(out, /\| Runs \(process\) \| 1 \|/);
    assert.match(out, /\| Articles processed \| 5 \|/);
    assert.match(out, /\| Articles published \| 2 \|/);
    assert.match(out, /\| Total cost \| \$0\.0620 \|/);
    // Per-stage rollup row for triage
    assert.match(out, /\| triage \| 5 \| 5000 \| 500 \| \$0\.0100 \|/);
    assert.match(out, /\| extract \| 4 \| 16000 \| 2000 \| \$0\.0400 \|/);
    assert.match(out, /\| factcheck \| 2 \| 4000 \| 600 \| \$0\.0120 \|/);
    assert.match(out, /\| total \| 11 \| 25000 \| 3100 \| \$0\.0620 \|/);
    // Failure breakdown counts
    assert.match(out, /\| triage_vendor_marketing \| 2 \|/);
    assert.match(out, /\| factcheck_invalid_cve \| 1 \|/);
    // Top failing sources (vendor-blog has 2 failures, newswire 1)
    assert.match(out, /\| vendor-blog \| 2 \|/);
    assert.match(out, /\| newswire \| 1 \|/);
    // Published rows must NOT contribute to failure counts
    assert.ok(!/\| schneier \|/.test(out));
  });
});

describe("generateSummary: multiple runs across stages and days", () => {
  it("counts runs by stage and ignores stages without a costs object", async () => {
    writeRunsIndex([
      {
        schema_version: 1,
        run_id: "p1",
        stage: "process",
        started_at: "2026-05-08T10:00:00Z",
        finished_at: "2026-05-08T10:00:30Z",
        duration_ms: 30000,
        git_sha: "sha1",
        dry_run: false,
        summary: {
          processed: 3,
          published: 1,
          costs: {
            triage: { calls: 3, input_tokens: 3000, output_tokens: 300, cost_usd: 0.005 },
            extract: { calls: 1, input_tokens: 4000, output_tokens: 500, cost_usd: 0.01 },
            factcheck: { calls: 1, input_tokens: 2000, output_tokens: 300, cost_usd: 0.006 },
            total: { calls: 5, input_tokens: 9000, output_tokens: 1100, cost_usd: 0.021 },
          },
        },
        file: "logs/runs/2026-05-08/process-p1.ndjson",
      },
      {
        schema_version: 1,
        run_id: "p2",
        stage: "process",
        started_at: "2026-05-09T10:00:00Z",
        finished_at: "2026-05-09T10:00:30Z",
        duration_ms: 30000,
        git_sha: "sha2",
        dry_run: false,
        summary: {
          processed: 4,
          published: 2,
          costs: {
            triage: { calls: 4, input_tokens: 4000, output_tokens: 400, cost_usd: 0.005 },
            extract: { calls: 2, input_tokens: 8000, output_tokens: 1000, cost_usd: 0.02 },
            factcheck: { calls: 2, input_tokens: 4000, output_tokens: 600, cost_usd: 0.012 },
            total: { calls: 8, input_tokens: 16000, output_tokens: 2000, cost_usd: 0.037 },
          },
        },
        file: "logs/runs/2026-05-09/process-p2.ndjson",
      },
      {
        schema_version: 1,
        run_id: "i1",
        stage: "ingest",
        started_at: "2026-05-09T10:30:00Z",
        finished_at: "2026-05-09T10:30:05Z",
        duration_ms: 5000,
        git_sha: "sha2",
        dry_run: false,
        // ingest summary has no `costs` / `processed` / `published` keys —
        // defensive reads must zero these out, not throw.
        summary: {
          totals: { fetched: 40, duplicates: 10, pre_filtered: 5, passed_to_triage: 25, error_count: 0 },
        },
        file: "logs/runs/2026-05-09/ingest-i1.ndjson",
      },
    ]);

    writeRunFile("logs/runs/2026-05-08/process-p1.ndjson", [
      {
        event: "article_done",
        article_id: "p1-a1",
        source_id: "krebs",
        terminal_state: "factcheck_failed",
        failure_code: "factcheck_unsupported",
      },
    ]);
    writeRunFile("logs/runs/2026-05-09/process-p2.ndjson", [
      {
        event: "article_done",
        article_id: "p2-a1",
        source_id: "krebs",
        terminal_state: "triage_rejected",
        failure_code: "triage_low_severity",
      },
    ]);
    writeRunFile("logs/runs/2026-05-09/ingest-i1.ndjson", [
      // ingest doesn't emit article_done — present here only to verify the
      // walker doesn't choke on a stage without article_done events.
      { event: "run_start", run_id: "i1" },
    ]);

    const out = await generateSummary({ root: tmpRoot, days: 7, now: FIXED_NOW });

    assert.match(out, /\| Runs \| 3 \|/);
    assert.match(out, /\| Runs \(ingest\) \| 1 \|/);
    assert.match(out, /\| Runs \(process\) \| 2 \|/);
    assert.match(out, /\| Articles processed \| 7 \|/);
    assert.match(out, /\| Articles published \| 3 \|/);
    // Total cost = 0.021 + 0.037 = 0.058
    assert.match(out, /\| Total cost \| \$0\.0580 \|/);
    // Per-stage rollup is the sum across both process runs
    assert.match(out, /\| triage \| 7 \| 7000 \| 700 \| \$0\.0100 \|/);
    assert.match(out, /\| total \| 13 \| 25000 \| 3100 \| \$0\.0580 \|/);
    assert.match(out, /\| factcheck_unsupported \| 1 \|/);
    assert.match(out, /\| triage_low_severity \| 1 \|/);
  });
});

describe("generateSummary: date filtering", () => {
  it("excludes rows older than the window and keeps the rest", async () => {
    writeRunsIndex([
      // 14 days before FIXED_NOW — outside default 7-day window
      {
        schema_version: 1,
        run_id: "old",
        stage: "process",
        started_at: "2026-04-26T12:00:00Z",
        finished_at: "2026-04-26T12:00:30Z",
        duration_ms: 30000,
        git_sha: "old",
        dry_run: false,
        summary: { processed: 100, published: 50 },
        file: "logs/runs/2026-04-26/process-old.ndjson",
      },
      // 2 days before FIXED_NOW — inside window
      {
        schema_version: 1,
        run_id: "recent",
        stage: "process",
        started_at: "2026-05-08T12:00:00Z",
        finished_at: "2026-05-08T12:00:30Z",
        duration_ms: 30000,
        git_sha: "new",
        dry_run: false,
        summary: { processed: 3, published: 2 },
        file: "logs/runs/2026-05-08/process-recent.ndjson",
      },
    ]);

    const out = await generateSummary({ root: tmpRoot, days: 7, now: FIXED_NOW });

    assert.match(out, /\| Runs \| 1 \|/);
    assert.match(out, /\| Articles processed \| 3 \|/);
    assert.match(out, /\| Articles published \| 2 \|/);
    // The old, excluded row's much-larger numbers must not appear anywhere.
    assert.ok(!/100/.test(out));
    assert.ok(!/50/.test(out));
  });
});

describe("generateSummary: missing per-run NDJSON files", () => {
  it("does not throw when a row references a file that no longer exists", async () => {
    writeRunsIndex([
      {
        schema_version: 1,
        run_id: "ghost",
        stage: "process",
        started_at: "2026-05-09T18:30:00Z",
        finished_at: "2026-05-09T18:30:30Z",
        duration_ms: 30000,
        git_sha: "ghost",
        dry_run: false,
        summary: { processed: 1, published: 1 },
        file: "logs/runs/2026-05-09/process-ghost.ndjson", // not written
      },
    ]);

    const out = await generateSummary({ root: tmpRoot, days: 7, now: FIXED_NOW });
    assert.match(out, /\| Runs \| 1 \|/);
    assert.match(out, /No failures recorded in this window/);
  });
});
