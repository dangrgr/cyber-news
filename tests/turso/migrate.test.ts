import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";

import { runMigrations, parseStatements } from "../../scripts/migrate.ts";

async function freshClient() {
  return createClient({ url: ":memory:" });
}

describe("runMigrations", () => {
  it("applies all migrations on first run and tracks them", async () => {
    const client = await freshClient();
    const results = await runMigrations(client, "migrations");
    const applied = results.filter((r) => r.action === "applied");
    assert.ok(applied.length >= 2, `expected >=2 applied, got ${applied.length}`);
    assert.ok(applied.some((r) => r.file === "0001_initial.sql"));
    assert.ok(applied.some((r) => r.file === "0002_phase2.sql"));

    // Tracker recorded both.
    const tracker = await client.execute(`SELECT id FROM _migrations ORDER BY id`);
    assert.deepEqual(
      tracker.rows.map((r) => String(r.id)),
      ["0001_initial.sql", "0002_phase2.sql"],
    );
  });

  it("is idempotent: second run skips everything", async () => {
    const client = await freshClient();
    await runMigrations(client, "migrations");
    const second = await runMigrations(client, "migrations");
    assert.ok(second.every((r) => r.action === "skipped"), JSON.stringify(second));
  });

  it("ALTER TABLE ADD COLUMN in 0002 runs exactly once (no duplicate-column error on re-run)", async () => {
    const client = await freshClient();
    await runMigrations(client, "migrations");
    // Second run would throw 'duplicate column' if 0002 re-ran.
    await assert.doesNotReject(runMigrations(client, "migrations"));
  });

  it("backfills 0001 if Phase 1 tables exist but tracking table doesn't", async () => {
    const client = await freshClient();
    // Simulate a pre-tracker-era deployment: Phase 1 tables applied by the old
    // migrate.ts (no _migrations record), Phase 2 not yet applied.
    const { readFile } = await import("node:fs/promises");
    const phase1Sql = await readFile("migrations/0001_initial.sql", "utf-8");
    for (const stmt of parseStatements(phase1Sql)) {
      await client.execute(stmt);
    }

    // First run of the new tracker-aware migrate: should backfill 0001 and apply 0002.
    const results = await runMigrations(client, "migrations");
    assert.ok(
      results.some((r) => r.file === "0001_initial.sql" && r.action === "backfilled"),
      `expected 0001 backfilled: ${JSON.stringify(results)}`,
    );
    assert.ok(
      results.some((r) => r.file === "0002_phase2.sql" && r.action === "applied"),
      `expected 0002 applied: ${JSON.stringify(results)}`,
    );
  });
});

describe("schema shape after migrations", () => {
  it("incidents has the Phase 2 widened columns", async () => {
    const client = await freshClient();
    await runMigrations(client, "migrations");
    const pragma = await client.execute(`PRAGMA table_info(incidents)`);
    const cols = new Set(pragma.rows.map((r) => String(r.name)));
    for (const c of [
      "victim_orgs_confirmed",
      "orgs_mentioned",
      "threat_actors_attributed",
      "actors_mentioned",
      "claim_markers_observed",
      "primary_source",
      "corroboration_tier1",
      "corroboration_tier2",
    ]) {
      assert.ok(cols.has(c), `missing column: ${c}`);
    }
  });

  it("cve_cache exists with expected columns", async () => {
    const client = await freshClient();
    await runMigrations(client, "migrations");
    const pragma = await client.execute(`PRAGMA table_info(cve_cache)`);
    const cols = new Set(pragma.rows.map((r) => String(r.name)));
    for (const c of ["cve_id", "exists_flag", "cvss_v31", "severity", "summary", "kev_listed", "fetched_at", "raw_json"]) {
      assert.ok(cols.has(c), `missing column: ${c}`);
    }
  });
});
