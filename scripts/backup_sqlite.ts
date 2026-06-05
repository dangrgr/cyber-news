import { copyFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";

import { configureLocalSqlite, getClient, getDatabaseUrl, initializeDatabase } from "../src/turso/client.ts";

function filePathFromDatabaseUrl(url: string): string {
  if (!url.startsWith("file:")) {
    throw new Error(`local backup requires file: TURSO_DATABASE_URL, got ${url}`);
  }
  return url.slice("file:".length);
}

function appHome(): string {
  return process.env.CYBER_NEWS_APP_HOME ?? "/home/dan/apps/cyber-news";
}

async function pruneBackups(dir: string, retentionDays: number, now = Date.now()): Promise<number> {
  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
  let pruned = 0;
  for (const name of await readdir(dir)) {
    if (!/^cyber-news-.*\.db$/.test(name)) continue;
    const file = path.join(dir, name);
    const s = await stat(file);
    if (s.mtimeMs < cutoff) {
      await unlink(file);
      pruned++;
    }
  }
  return pruned;
}

export async function backupLocalSqlite(): Promise<{ backup: string; pruned: number }> {
  const url = getDatabaseUrl();
  const dbPath = filePathFromDatabaseUrl(url);
  const backupDir = process.env.BACKUP_DIR ?? path.join(appHome(), "backups");
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? "14") || 14;

  await mkdir(backupDir, { recursive: true, mode: 0o700 });

  const client = getClient();
  await initializeDatabase(client, url);
  await client.execute(`PRAGMA wal_checkpoint(FULL)`);

  const stamp = new Date().toISOString().replace(/[:.]/g, "").replace("T", "-").slice(0, 16);
  const backup = path.join(backupDir, `cyber-news-${stamp}.db`);
  await copyFile(dbPath, backup);

  const backupClient = createClient({ url: `file:${backup}` });
  await configureLocalSqlite(backupClient, `file:${backup}`);
  const integrity = await backupClient.execute(`PRAGMA integrity_check`);
  const result = String(Object.values(integrity.rows[0] ?? { integrity_check: "missing" })[0]);
  if (result !== "ok") {
    throw new Error(`backup integrity_check failed: ${result}`);
  }

  const pruned = await pruneBackups(backupDir, retentionDays);
  return { backup, pruned };
}

async function main(): Promise<void> {
  const result = await backupLocalSqlite();
  console.log(JSON.stringify({ status: "complete", ...result }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(JSON.stringify({ backup: "fatal", error: err instanceof Error ? err.message : String(err) }));
    process.exit(1);
  });
}
