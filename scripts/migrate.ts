// Apply every .sql file in migrations/ to the configured Turso database, in name order.
// Idempotent: each migration uses CREATE ... IF NOT EXISTS.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getClient } from "../src/turso/client.ts";

async function main() {
  const dir = "migrations";
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.log(JSON.stringify({ migrate: "noop", reason: "no_sql_files" }));
    return;
  }
  const client = getClient();
  for (const f of files) {
    const sql = await readFile(join(dir, f), "utf-8");
    // Split on `;` at end-of-statement; keep it simple — our migrations only use
    // standard CREATE TABLE / CREATE INDEX with no embedded semicolons.
    const statements = sql
      .split(/;\s*\n/)
      // Strip leading `-- ...` comment lines so a file that opens with a header
      // comment doesn't accidentally suppress its first real statement.
      .map((s) =>
        s
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim(),
      )
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    console.log(JSON.stringify({ migrate: "applied", file: f, statements: statements.length }));
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ migrate: "fatal", error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
