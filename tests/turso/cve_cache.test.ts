import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient, type Client } from "@libsql/client";

import { runMigrations } from "../../scripts/migrate.ts";
import { getCached, upsertCached, isFresh } from "../../src/turso/cve_cache.ts";

let client: Client;

beforeEach(async () => {
  client = createClient({ url: ":memory:" });
  await runMigrations(client, "migrations");
});

describe("cve_cache repo", () => {
  it("returns null on miss", async () => {
    assert.equal(await getCached(client, "CVE-2099-0001"), null);
  });

  it("upserts a positive cache entry and reads it back", async () => {
    await upsertCached(client, {
      cveId: "CVE-2026-12345",
      exists: true,
      cvssV31: 9.8,
      severity: "CRITICAL",
      summary: "Use-after-free in example.dll",
      kevListed: true,
    });
    const row = await getCached(client, "CVE-2026-12345");
    assert.ok(row);
    assert.equal(row!.exists, true);
    assert.equal(row!.cvss_v31, 9.8);
    assert.equal(row!.severity, "CRITICAL");
    assert.equal(row!.kev_listed, true);
  });

  it("caches negative results (exists=false) too", async () => {
    await upsertCached(client, { cveId: "CVE-2099-9999", exists: false });
    const row = await getCached(client, "CVE-2099-9999");
    assert.ok(row);
    assert.equal(row!.exists, false);
  });

  it("upsert is a true upsert: second call overwrites", async () => {
    await upsertCached(client, { cveId: "CVE-2026-1", exists: false });
    await upsertCached(client, { cveId: "CVE-2026-1", exists: true, severity: "HIGH" });
    const row = await getCached(client, "CVE-2026-1");
    assert.equal(row!.exists, true);
    assert.equal(row!.severity, "HIGH");
  });
});

describe("isFresh TTL logic", () => {
  const base: Parameters<typeof isFresh>[0] = {
    cve_id: "CVE-2026-1",
    exists: true,
    cvss_v31: null,
    severity: null,
    summary: null,
    kev_listed: false,
    fetched_at: "2026-04-10T00:00:00.000Z",
    raw_json: null,
  };

  it("returns true when fetched_at is within TTL", () => {
    assert.equal(isFresh(base, 14, new Date("2026-04-20T00:00:00.000Z")), true);
  });

  it("returns false when fetched_at is past TTL", () => {
    assert.equal(isFresh(base, 14, new Date("2026-05-01T00:00:00.000Z")), false);
  });

  it("returns false when fetched_at is in the future (clock skew)", () => {
    assert.equal(isFresh(base, 14, new Date("2026-04-09T00:00:00.000Z")), false);
  });

  it("returns false on unparseable fetched_at", () => {
    assert.equal(isFresh({ ...base, fetched_at: "not-a-date" }, 14), false);
  });
});
