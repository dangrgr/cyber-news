import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  NOOP_LOGGER,
  SCHEMA_VERSION,
  startRun,
} from "../../src/util/run_log.ts";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(path.join(tmpdir(), "runlog-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

function fixedClock(iso: string): () => Date {
  // mutable cursor so successive ts values stay monotonically non-decreasing
  // but predictable.
  let n = 0;
  const base = new Date(iso).getTime();
  return () => new Date(base + n++);
}

function readNdjson(file: string): Record<string, unknown>[] {
  return readFileSync(file, "utf-8")
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l) as Record<string, unknown>);
}

describe("startRun: file naming + run_start event", () => {
  it("creates logs/runs/{date}/{stage}-{runId}.ndjson and emits run_start with git_sha", async () => {
    const log = startRun("process", {
      root: tmpRoot,
      now: fixedClock("2026-05-09T18:30:00Z"),
      env: { MODEL_TRIAGE: "claude-haiku-4-5", NODE_ENV: "test" },
      gitSha: () => "deadbeef",
    });

    await log.finishRun({ ok: true });

    const dateDir = path.join(tmpRoot, "logs", "runs", "2026-05-09");
    const files = readdirSync(dateDir);
    assert.equal(files.length, 1);
    const file = files[0]!;
    assert.match(file, /^process-[0-9a-f]{8}\.ndjson$/);
    assert.ok(file.includes(log.runId));

    const events = readNdjson(path.join(dateDir, file));
    assert.equal(events[0]!.event, "run_start");
    assert.equal(events[0]!.schema_version, SCHEMA_VERSION);
    assert.equal(events[0]!.run_id, log.runId);
    assert.equal(events[0]!.stage, "process");
    assert.equal(events[0]!.git_sha, "deadbeef");
    assert.equal(events[0]!.dry_run, false);
    assert.equal(events[0]!.node_env, "test");
    assert.deepEqual(events[0]!.models_active, { MODEL_TRIAGE: "claude-haiku-4-5" });
  });
});

describe("logCall + logEvent + finishRun ordering", () => {
  it("writes parseable NDJSON, captures full raw_output, ends with run_summary, and appends INDEX", async () => {
    const log = startRun("process", {
      root: tmpRoot,
      now: fixedClock("2026-05-09T18:30:00Z"),
      env: { DRY_RUN: "1" },
      gitSha: () => "abc1234",
    });

    const fullRaw = "x".repeat(50_000); // 50 KB — assert no truncation
    log.logCall({
      model: "claude-haiku-4-5",
      input_tokens: 1200,
      output_tokens: 150,
      cost_usd: 0.0019,
      duration_ms: 300,
      payload_digest: "deadbeefcafebabe",
      raw_output: fullRaw,
    });
    log.logEvent({ event: "discord_payload", dry_run: true });
    await log.finishRun({ articles_processed: 1, total_cost_usd: 0.0019 });

    const dateDir = path.join(tmpRoot, "logs", "runs", "2026-05-09");
    const file = path.join(dateDir, readdirSync(dateDir)[0]!);
    const events = readNdjson(file);

    // run_start, model_call, discord_payload, run_summary
    assert.equal(events.length, 4);
    assert.equal(events[0]!.event, "run_start");
    assert.equal(events[1]!.event, "model_call");
    assert.equal((events[1] as { raw_output: string }).raw_output.length, 50_000);
    assert.equal((events[1] as { raw_output: string }).raw_output, fullRaw);
    assert.equal(events[2]!.event, "discord_payload");
    assert.equal(events[3]!.event, "run_summary");
    const summary = (events[3] as { summary: { articles_processed: number } }).summary;
    assert.equal(summary.articles_processed, 1);

    // INDEX.ndjson appended
    const indexPath = path.join(tmpRoot, "logs", "runs", "INDEX.ndjson");
    const rows = readNdjson(indexPath);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.run_id, log.runId);
    assert.equal(rows[0]!.stage, "process");
    assert.equal(rows[0]!.git_sha, "abc1234");
    assert.equal(rows[0]!.dry_run, true);
    assert.equal(rows[0]!.schema_version, SCHEMA_VERSION);
    assert.match(rows[0]!.file as string, /^logs\/runs\/2026-05-09\/process-/);
  });

  it("appends multiple INDEX rows when finishRun is called for separate runs", async () => {
    const a = startRun("process", { root: tmpRoot, env: {}, gitSha: () => "sha-a" });
    await a.finishRun({});
    const b = startRun("ingest", { root: tmpRoot, env: {}, gitSha: () => "sha-b" });
    await b.finishRun({});

    const indexPath = path.join(tmpRoot, "logs", "runs", "INDEX.ndjson");
    const rows = readNdjson(indexPath);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]!.git_sha, "sha-a");
    assert.equal(rows[1]!.git_sha, "sha-b");
  });
});

describe("RUN_LOG_DISABLED kill-switch", () => {
  it("returns NOOP_LOGGER and writes no files when RUN_LOG_DISABLED=1", async () => {
    const log = startRun("process", {
      root: tmpRoot,
      env: { RUN_LOG_DISABLED: "1" },
    });
    assert.equal(log, NOOP_LOGGER);

    log.logCall({
      model: "claude-haiku-4-5",
      input_tokens: 1,
      output_tokens: 1,
      cost_usd: 0,
      duration_ms: 0,
    });
    log.logEvent({ event: "anything" });
    await log.finishRun({ ok: true });

    // No date dir created, no INDEX written.
    const runsDir = path.join(tmpRoot, "logs", "runs");
    if (existsSync(runsDir)) {
      assert.deepEqual(readdirSync(runsDir), []);
    }
  });
});
