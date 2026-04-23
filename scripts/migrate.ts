// Apply each .sql file in migrations/ exactly once, tracked via the _migrations
// table. Safe for non-idempotent statements (e.g. ALTER TABLE ADD COLUMN).
//
// On the first run after this tracker lands, any .sql file whose core tables
// already exist will be recorded as applied without re-running — see `runMigrations`.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Client } from "@libsql/client";

import { getClient } from "../src/turso/client.ts";

const TRACKING_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS _migrations (
    id         TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )
`;

export interface MigrationResult {
  file: string;
  action: "applied" | "skipped" | "backfilled";
  statements: number;
}

/**
 * Applies pending migrations. Exported so tests can drive this against an
 * in-memory libSQL client without spawning a subprocess.
 */
export async function runMigrations(client: Client, dir = "migrations"): Promise<MigrationResult[]> {
  await client.execute(TRACKING_TABLE_DDL);

  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied = new Set(
    (await client.execute(`SELECT id FROM _migrations`)).rows.map((r) => String(r.id)),
  );

  // Backfill heuristic: if _migrations is empty but core Phase 1 tables exist,
  // the existing migrations were applied before this tracker was introduced.
  // Record the earliest migration as backfilled to preserve invariants.
  const results: MigrationResult[] = [];
  const now = new Date().toISOString();

  if (applied.size === 0 && files.length > 0) {
    const tables = await client.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('articles','incidents','entity_aliases','investigations')`,
    );
    if (tables.rows.length >= 4) {
      const first = files[0]!;
      await client.execute({
        sql: `INSERT INTO _migrations (id, applied_at) VALUES (?, ?)`,
        args: [first, now],
      });
      applied.add(first);
      results.push({ file: first, action: "backfilled", statements: 0 });
    }
  }

  for (const f of files) {
    if (applied.has(f)) {
      if (!results.some((r) => r.file === f)) {
        results.push({ file: f, action: "skipped", statements: 0 });
      }
      continue;
    }
    const statements = parseStatements(await readFile(join(dir, f), "utf-8"));
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    await client.execute({
      sql: `INSERT INTO _migrations (id, applied_at) VALUES (?, ?)`,
      args: [f, now],
    });
    results.push({ file: f, action: "applied", statements: statements.length });
  }

  return results;
}

export function parseStatements(sql: string): string[] {
  return sql
    .split(/;\s*\n/)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);
}

async function main(): Promise<void> {
  const client = getClient();
  const results = await runMigrations(client);
  if (results.length === 0) {
    console.log(JSON.stringify({ migrate: "noop", reason: "no_sql_files" }));
    return;
  }
  for (const r of results) {
    console.log(JSON.stringify({ migrate: r.action, file: r.file, statements: r.statements }));
  }
}

// Only run when invoked as a script (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(JSON.stringify({ migrate: "fatal", error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  });
}
