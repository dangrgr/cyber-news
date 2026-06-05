import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient } from "@libsql/client";

import { configureLocalSqlite, ensureLocalSqliteParentDir } from "../../src/turso/client.ts";

const tmpDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("configureLocalSqlite", () => {
  it("applies WAL, busy_timeout, and synchronous=NORMAL for file-backed SQLite URLs", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cyber-news-db-"));
    tmpDirs.push(dir);
    const dbPath = path.join(dir, "cyber-news.db");
    const url = `file:${dbPath}`;
    const client = createClient({ url });

    await configureLocalSqlite(client, url);

    const journal = await client.execute(`PRAGMA journal_mode`);
    const busy = await client.execute(`PRAGMA busy_timeout`);
    const sync = await client.execute(`PRAGMA synchronous`);

    assert.equal(String(journal.rows[0]!.journal_mode).toLowerCase(), "wal");
    assert.equal(Number(busy.rows[0]!.timeout), 5000);
    // SQLite reports NORMAL as numeric 1.
    assert.equal(Number(sync.rows[0]!.synchronous), 1);
  });

  it("creates the parent directory for app-home file-backed SQLite URLs", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cyber-news-db-parent-"));
    tmpDirs.push(dir);
    const parent = path.join(dir, "state", "nested");
    const dbPath = path.join(parent, "cyber-news.db");

    ensureLocalSqliteParentDir(`file:${dbPath}`);

    assert.equal(existsSync(parent), true);
  });
});
