// One-shot seed: copy production data from the remote Turso DB into the local
// file-backed SQLite that the Hermes runtime uses after the cutover (issue #41,
// PR #42).
//
// Why this exists: dedup and publish-gating are entirely DB-backed. `migrate`
// only creates *schema*; it copies no data. Cutting the local runtime over to an
// empty DB makes every still-in-feed article look brand-new — re-ingested,
// re-processed, and (worst of all) re-published to Discord, plus the entire
// `articles`/`incidents` history/audit trail is lost. Seeding the local file
// from Turso first turns that storm into a non-event.
//
// Safety posture (per #41 decision + PR #42 review):
//   - Refuses to run if the local CORE tables (articles, incidents) already hold
//     rows. This is a clean one-shot, not a merge — re-running against a
//     populated DB aborts before any write.
//   - Refuses to write anywhere that isn't a local `file:` URL, so it can never
//     accidentally copy local -> remote.
//   - DRY_RUN=1 previews the plan (row counts, guard status) without writing.
//
// Env contract:
//   TURSO_SOURCE_URL          remote libsql:// URL to copy FROM (required)
//   TURSO_SOURCE_AUTH_TOKEN   auth token for the source (optional for file:)
//   LOCAL_DB_URL              destination file: URL to copy INTO; falls back to
//                             TURSO_DATABASE_URL, then file:./local.db. Must be file:.
//   DRY_RUN=1                 preview only

import { createClient, type Client } from "@libsql/client";

// CORE tables are the irreplaceable ones: losing them causes the duplicate-publish
// storm and destroys the audit trail. They must be empty in the destination or we
// abort the whole run before writing anything.
const CORE_TABLES = ["articles", "incidents"] as const;
// REGENERABLE tables are rebuilt by the pipeline anyway (entity_aliases is
// re-seeded from entities.yaml every process run; cve_cache re-fetches from NVD;
// investigations are out of MVP scope). We copy them for completeness, but if the
// destination already has rows we skip that table rather than aborting.
const REGENERABLE_TABLES = ["entity_aliases", "cve_cache", "investigations"] as const;
const ALL_TABLES = [...CORE_TABLES, ...REGENERABLE_TABLES];

const BATCH_SIZE = 500;

export interface TableSeedResult {
  table: string;
  core: boolean;
  status: "copied" | "skipped_non_empty" | "skipped_missing" | "would_copy";
  source_rows: number;
  dest_rows_before: number;
  dest_rows_after: number;
  /** Columns present in the source but absent in the destination (schema drift). */
  dropped_columns: string[];
}

export interface SeedReport {
  dry_run: boolean;
  tables: TableSeedResult[];
}

async function tableExists(client: Client, name: string): Promise<boolean> {
  const res = await client.execute({
    sql: `SELECT 1 FROM sqlite_master WHERE type IN ('table','view') AND name = ? LIMIT 1`,
    args: [name],
  });
  return res.rows.length > 0;
}

async function countRows(client: Client, name: string): Promise<number> {
  const res = await client.execute(`SELECT COUNT(*) AS n FROM ${name}`);
  return Number(res.rows[0]!.n);
}

async function columnsOf(client: Client, name: string): Promise<string[]> {
  const res = await client.execute(`PRAGMA table_info(${name})`);
  return res.rows.map((r) => String(r.name));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function copyTable(
  source: Client,
  dest: Client,
  name: string,
  core: boolean,
): Promise<TableSeedResult> {
  const destCols = await columnsOf(dest, name);
  const destColSet = new Set(destCols);

  const sourceRows = await source.execute(`SELECT * FROM ${name}`);
  const sourceCols = sourceRows.columns;
  // Only copy columns that exist in BOTH schemas. A column present in the source
  // but missing in the destination is reported as dropped rather than silently
  // throwing, so a future source-side schema change degrades loudly-but-safely.
  const cols = sourceCols.filter((c) => destColSet.has(c));
  const dropped = sourceCols.filter((c) => !destColSet.has(c));

  const placeholders = cols.map(() => "?").join(", ");
  const colList = cols.map((c) => `"${c}"`).join(", ");
  const insertSql = `INSERT OR IGNORE INTO ${name} (${colList}) VALUES (${placeholders})`;

  const stmts = sourceRows.rows.map((row) => ({
    sql: insertSql,
    // Index by column name; libSQL Row supports named access. Order matches `cols`.
    args: cols.map((c) => (row as Record<string, unknown>)[c] as never),
  }));

  for (const group of chunk(stmts, BATCH_SIZE)) {
    if (group.length > 0) await dest.batch(group, "write");
  }

  const after = await countRows(dest, name);
  return {
    table: name,
    core,
    status: "copied",
    source_rows: sourceRows.rows.length,
    dest_rows_before: 0,
    dest_rows_after: after,
    dropped_columns: dropped,
  };
}

/**
 * Copy CORE + REGENERABLE tables from `source` into `dest`.
 *
 * Exported (like `runMigrations`) so tests can drive it against two file-backed
 * SQLite DBs without going through env wiring.
 */
export async function seedLocalFromTurso(
  source: Client,
  dest: Client,
  opts: { dryRun?: boolean } = {},
): Promise<SeedReport> {
  const dryRun = opts.dryRun ?? false;

  // Pre-flight: CORE tables must exist in the destination (migrate must have run).
  for (const name of CORE_TABLES) {
    if (!(await tableExists(dest, name))) {
      throw new Error(`destination is missing core table '${name}'; run \`npm run migrate\` first`);
    }
  }

  // Guard: refuse on a non-empty destination. Checked across ALL core tables
  // before any write so a partially-seeded DB can't be silently topped up.
  const nonEmptyCore: string[] = [];
  for (const name of CORE_TABLES) {
    if ((await countRows(dest, name)) > 0) nonEmptyCore.push(name);
  }
  if (nonEmptyCore.length > 0 && !dryRun) {
    throw new Error(
      `refusing to seed: destination core tables already contain rows (${nonEmptyCore.join(", ")}). ` +
        `This is a one-shot seed, not a merge. Use a fresh migrated DB, or remove the existing file.`,
    );
  }

  const tables: TableSeedResult[] = [];

  for (const name of ALL_TABLES) {
    const core = (CORE_TABLES as readonly string[]).includes(name);

    if (!(await tableExists(dest, name)) || !(await tableExists(source, name))) {
      tables.push({
        table: name,
        core,
        status: "skipped_missing",
        source_rows: 0,
        dest_rows_before: 0,
        dest_rows_after: 0,
        dropped_columns: [],
      });
      continue;
    }

    const before = await countRows(dest, name);

    // Regenerable tables that already hold rows are left untouched.
    if (!core && before > 0) {
      tables.push({
        table: name,
        core,
        status: "skipped_non_empty",
        source_rows: await countRows(source, name),
        dest_rows_before: before,
        dest_rows_after: before,
        dropped_columns: [],
      });
      continue;
    }

    if (dryRun) {
      tables.push({
        table: name,
        core,
        status: "would_copy",
        source_rows: await countRows(source, name),
        dest_rows_before: before,
        dest_rows_after: before,
        dropped_columns: [],
      });
      continue;
    }

    const result = await copyTable(source, dest, name, core);
    result.dest_rows_before = before;
    tables.push(result);
  }

  return { dry_run: dryRun, tables };
}

function makeSourceClient(env: NodeJS.ProcessEnv): Client {
  const url = env.TURSO_SOURCE_URL;
  if (!url) {
    throw new Error("TURSO_SOURCE_URL is required (the remote libsql:// URL to copy FROM)");
  }
  return createClient({ url, authToken: env.TURSO_SOURCE_AUTH_TOKEN || undefined });
}

function makeDestClient(env: NodeJS.ProcessEnv): { client: Client; url: string } {
  const url = env.LOCAL_DB_URL ?? env.TURSO_DATABASE_URL ?? "file:./local.db";
  if (!url.startsWith("file:")) {
    throw new Error(
      `seed destination must be a local file: URL, got '${url}'. Refusing to write into a remote DB.`,
    );
  }
  if (url === env.TURSO_SOURCE_URL) {
    throw new Error("source and destination URLs are identical; refusing to seed a DB from itself");
  }
  return { client: createClient({ url }), url };
}

async function main(): Promise<void> {
  const env = process.env;
  const dryRun = env.DRY_RUN === "1";

  const source = makeSourceClient(env);
  const { client: dest, url: destUrl } = makeDestClient(env);

  const report = await seedLocalFromTurso(source, dest, { dryRun });

  const verifyFailures = report.tables.filter(
    (t) => t.status === "copied" && t.source_rows !== t.dest_rows_after,
  );

  console.log(
    JSON.stringify(
      {
        seed: dryRun ? "dry_run" : "complete",
        destination: destUrl,
        tables: report.tables,
        ...(verifyFailures.length > 0
          ? { verify: "MISMATCH", mismatched: verifyFailures.map((t) => t.table) }
          : { verify: "ok" }),
      },
      null,
      2,
    ),
  );

  if (verifyFailures.length > 0) {
    throw new Error(
      `row-count verification failed for: ${verifyFailures.map((t) => t.table).join(", ")}`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(JSON.stringify({ seed: "fatal", error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  });
}
