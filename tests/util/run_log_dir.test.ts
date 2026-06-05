import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { startRun } from "../../src/util/run_log.ts";

let tmpRoot: string;
let tmpLogs: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(path.join(tmpdir(), "runlog-root-"));
  tmpLogs = mkdtempSync(path.join(tmpdir(), "runlog-logs-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
  await rm(tmpLogs, { recursive: true, force: true });
});

function readNdjson(file: string): Record<string, unknown>[] {
  return readFileSync(file, "utf-8")
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l) as Record<string, unknown>);
}

describe("RUN_LOG_DIR", () => {
  it("relocates run logs outside the repo while preserving runs/ layout", async () => {
    const log = startRun("process", {
      root: tmpRoot,
      env: { RUN_LOG_DIR: tmpLogs },
      gitSha: () => "sha",
      now: () => new Date("2026-06-04T12:00:00Z"),
    });

    await log.finishRun({ ok: true });

    const repoRunsDir = path.join(tmpRoot, "logs", "runs");
    assert.equal(existsSync(repoRunsDir), false);

    const dateDir = path.join(tmpLogs, "runs", "2026-06-04");
    const files = readdirSync(dateDir);
    assert.equal(files.length, 1);
    assert.match(files[0]!, /^process-[0-9a-f]{8}\.ndjson$/);

    const indexRows = readNdjson(path.join(tmpLogs, "runs", "INDEX.ndjson"));
    assert.equal(indexRows.length, 1);
    assert.match(indexRows[0]!.file as string, /^\/.*\/runs\/2026-06-04\/process-/);
  });
});
