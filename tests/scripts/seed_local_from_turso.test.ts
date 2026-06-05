import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

import { runMigrations } from "../../scripts/migrate.ts";
import { seedLocalFromTurso } from "../../scripts/seed_local_from_turso.ts";

const tmpDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function migratedFileDb(label: string): Promise<{ client: Client; url: string }> {
  const dir = mkdtempSync(path.join(tmpdir(), `seed-${label}-`));
  tmpDirs.push(dir);
  const url = `file:${path.join(dir, "db.sqlite")}`;
  const client = createClient({ url });
  await runMigrations(client, "migrations");
  return { client, url };
}

async function insertArticle(client: Client, id: string, stage = "published"): Promise<void> {
  await client.execute({
    sql: `INSERT INTO articles
            (id, source_id, url, canonical_url, title, author, published_at, ingested_at,
             raw_text, stage_reached, failure_reason, incident_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, "krebs", `https://x/${id}`, `https://x/${id}`, `t-${id}`, null,
           "2026-06-01T00:00:00Z", "2026-06-01T00:00:00Z", "body", stage, null, null],
  });
}

async function insertIncident(client: Client, id: string): Promise<void> {
  await client.execute({
    sql: `INSERT INTO incidents
            (id, first_seen_at, last_updated_at, title, summary, confidence,
             victim_orgs, threat_actors, cves, source_urls)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, "2026-06-01T00:00:00Z", "2026-06-01T00:00:00Z", `inc-${id}`, "s",
           "reported", "[]", "[]", "[]", "[]"],
  });
}

describe("seedLocalFromTurso", () => {
  it("copies core + regenerable tables from source into an empty migrated dest", async () => {
    const source = await migratedFileDb("src");
    const dest = await migratedFileDb("dst");

    await insertArticle(source.client, "a1");
    await insertArticle(source.client, "a2");
    await insertIncident(source.client, "i1");
    await source.client.execute({
      sql: `INSERT INTO entity_aliases (alias, canonical, entity_type, confidence) VALUES (?, ?, ?, ?)`,
      args: ["Handala", "Void Manticore", "actor", 0.9],
    });

    const report = await seedLocalFromTurso(source.client, dest.client);

    const articles = report.tables.find((t) => t.table === "articles")!;
    assert.equal(articles.status, "copied");
    assert.equal(articles.source_rows, 2);
    assert.equal(articles.dest_rows_after, 2);
    assert.deepEqual(articles.dropped_columns, []);

    assert.equal((await dest.client.execute(`SELECT COUNT(*) n FROM incidents`)).rows[0]!.n, 1);
    assert.equal((await dest.client.execute(`SELECT COUNT(*) n FROM entity_aliases`)).rows[0]!.n, 1);
  });

  it("refuses to seed when a core table already has rows", async () => {
    const source = await migratedFileDb("src");
    const dest = await migratedFileDb("dst");
    await insertArticle(source.client, "a1");
    await insertArticle(dest.client, "existing"); // dest not empty

    await assert.rejects(
      () => seedLocalFromTurso(source.client, dest.client),
      /refusing to seed: destination core tables already contain rows/,
    );

    // Guard fires before any write: the source row must not have leaked in.
    assert.equal((await dest.client.execute(`SELECT COUNT(*) n FROM articles`)).rows[0]!.n, 1);
  });

  it("skips a regenerable table that already has rows but still seeds core", async () => {
    const source = await migratedFileDb("src");
    const dest = await migratedFileDb("dst");
    await insertArticle(source.client, "a1");
    await source.client.execute({
      sql: `INSERT INTO entity_aliases (alias, canonical, entity_type, confidence) VALUES (?, ?, ?, ?)`,
      args: ["src-alias", "Canon", "actor", 1.0],
    });
    await dest.client.execute({
      sql: `INSERT INTO entity_aliases (alias, canonical, entity_type, confidence) VALUES (?, ?, ?, ?)`,
      args: ["dst-alias", "Canon", "actor", 1.0],
    });

    const report = await seedLocalFromTurso(source.client, dest.client);

    assert.equal(report.tables.find((t) => t.table === "articles")!.status, "copied");
    const aliases = report.tables.find((t) => t.table === "entity_aliases")!;
    assert.equal(aliases.status, "skipped_non_empty");
    // The dest's own alias is preserved, the source's is not copied in.
    const rows = await dest.client.execute(`SELECT alias FROM entity_aliases ORDER BY alias`);
    assert.deepEqual(rows.rows.map((r) => String(r.alias)), ["dst-alias"]);
  });

  it("dry-run writes nothing and reports would_copy", async () => {
    const source = await migratedFileDb("src");
    const dest = await migratedFileDb("dst");
    await insertArticle(source.client, "a1");

    const report = await seedLocalFromTurso(source.client, dest.client, { dryRun: true });

    assert.equal(report.dry_run, true);
    assert.equal(report.tables.find((t) => t.table === "articles")!.status, "would_copy");
    assert.equal((await dest.client.execute(`SELECT COUNT(*) n FROM articles`)).rows[0]!.n, 0);
  });
});
