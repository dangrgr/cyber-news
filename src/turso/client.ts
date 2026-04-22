// Turso (libSQL) client. Same shape works for prod (`libsql://...`) and local
// dev (`file:./local.db`) — see PRD §6 final paragraph and §14 Phase 1.

import { createClient, type Client } from "@libsql/client";

let cached: Client | null = null;

export function getClient(): Client {
  if (cached) return cached;

  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  cached = createClient({ url, authToken });
  return cached;
}

// Test seam: callers in tests can inject an in-memory client without touching env vars.
export function setClientForTesting(client: Client | null): void {
  cached = client;
}
