// Turso (libSQL) client. Same shape works for prod (`libsql://...`) and local
// dev (`file:./local.db`) — see PRD §6 final paragraph and §14 Phase 1.

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient, type Client } from "@libsql/client";

let cached: Client | null = null;
let initialized = false;

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.TURSO_DATABASE_URL ?? "file:./local.db";
}

export function getClient(): Client {
  if (cached) return cached;

  const url = getDatabaseUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  ensureLocalSqliteParentDir(url);

  cached = createClient({ url, authToken });
  initialized = false;
  return cached;
}

export async function initializeDatabase(client: Client = getClient(), url = getDatabaseUrl()): Promise<void> {
  if (initialized) return;
  await configureLocalSqlite(client, url);
  initialized = true;
}

export async function configureLocalSqlite(client: Client, url: string): Promise<void> {
  if (!isFileBackedSqliteUrl(url)) return;

  await client.execute(`PRAGMA journal_mode=WAL`);
  await client.execute(`PRAGMA busy_timeout=5000`);
  await client.execute(`PRAGMA synchronous=NORMAL`);
}

export function ensureLocalSqliteParentDir(url: string): void {
  if (!isFileBackedSqliteUrl(url)) return;
  const dbPath = url.slice("file:".length);
  if (dbPath.length === 0 || dbPath.startsWith("?")) return;
  mkdirSync(dirname(dbPath), { recursive: true, mode: 0o700 });
}

function isFileBackedSqliteUrl(url: string): boolean {
  return url.startsWith("file:") && url !== "file::memory:" && url !== ":memory:";
}

// Test seam: callers in tests can inject an in-memory client without touching env vars.
export function setClientForTesting(client: Client | null): void {
  cached = client;
  initialized = false;
}
