import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient, type Client } from "@libsql/client";

import { runMigrations } from "../../scripts/migrate.ts";
import { lookupCve, cveExists, normalizeCveId } from "../../src/factcheck/cve_cache.ts";
import type { NvdClient, NvdLookupResult } from "../../src/clients/nvd.ts";

let client: Client;

beforeEach(async () => {
  client = createClient({ url: ":memory:" });
  await runMigrations(client, "migrations");
});

function mockNvd(responses: Record<string, NvdLookupResult>): NvdClient & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async lookup(cveId: string) {
      calls.push(cveId);
      const r = responses[cveId];
      if (!r) {
        return { exists: false, cvssV31: null, severity: null, summary: null, rawJson: null };
      }
      return r;
    },
  };
}

describe("normalizeCveId", () => {
  it("uppercases and trims a valid id", () => {
    assert.equal(normalizeCveId("  cve-2026-1234 "), "CVE-2026-1234");
  });

  it("returns null on malformed ids", () => {
    assert.equal(normalizeCveId("CVE-BAD"), null);
    assert.equal(normalizeCveId("not a cve"), null);
    assert.equal(normalizeCveId("CVE-2026"), null);
  });
});

describe("lookupCve: read-through cache", () => {
  it("calls NVD on cache miss and stores the result", async () => {
    const nvd = mockNvd({
      "CVE-2026-31200": {
        exists: true,
        cvssV31: 9.8,
        severity: "CRITICAL",
        summary: "authn bypass",
        rawJson: "{}",
      },
    });
    const r = await lookupCve("CVE-2026-31200", { client, nvd });
    assert.equal(r.exists, true);
    assert.equal(r.cvss_v31, 9.8);
    assert.equal(nvd.calls.length, 1);

    // Second call: served from cache, no new NVD call.
    await lookupCve("CVE-2026-31200", { client, nvd });
    assert.equal(nvd.calls.length, 1);
  });

  it("caches negative results (exists=false) so hallucinated ids don't refetch", async () => {
    const nvd = mockNvd({});
    const r1 = await lookupCve("CVE-2099-9999", { client, nvd });
    assert.equal(r1.exists, false);
    assert.equal(nvd.calls.length, 1);

    const r2 = await lookupCve("CVE-2099-9999", { client, nvd });
    assert.equal(r2.exists, false);
    assert.equal(nvd.calls.length, 1);
  });

  it("refetches when the cached row is past TTL", async () => {
    const nvd = mockNvd({
      "CVE-2026-1234": { exists: true, cvssV31: 5.0, severity: "MEDIUM", summary: null, rawJson: null },
    });
    // Seed old row through lookupCve with an old `now`.
    await lookupCve("CVE-2026-1234", {
      client,
      nvd,
      ttlDays: 1,
      now: () => new Date("2026-01-01T00:00:00Z"),
    });
    assert.equal(nvd.calls.length, 1);

    // Look up again many days later — should refetch.
    await lookupCve("CVE-2026-1234", {
      client,
      nvd,
      ttlDays: 1,
      now: () => new Date("2026-02-01T00:00:00Z"),
    });
    assert.equal(nvd.calls.length, 2);
  });

  it("does not cache rate-limited results (treats as transient, re-verifies later)", async () => {
    // First call: rate-limited. Second call: real answer.
    let i = 0;
    const nvd: NvdClient & { calls: string[] } = {
      calls: [],
      async lookup(cveId: string) {
        this.calls.push(cveId);
        if (i++ === 0) {
          return { exists: true, cvssV31: null, severity: null, summary: null, rawJson: null, rateLimited: true };
        }
        return { exists: true, cvssV31: 9.8, severity: "CRITICAL", summary: "real", rawJson: "{}" };
      },
    };
    const r1 = await lookupCve("CVE-2026-1234", { client, nvd });
    assert.equal(r1.exists, true, "trust LLM while NVD is degraded");

    const r2 = await lookupCve("CVE-2026-1234", { client, nvd });
    assert.equal(nvd.calls.length, 2, "should re-hit NVD on second call since rate-limit wasn't cached");
    assert.equal(r2.severity, "CRITICAL");
  });

  it("does not cache malformed ids", async () => {
    const nvd = mockNvd({});
    const r = await lookupCve("CVE-BAD", { client, nvd });
    assert.equal(r.exists, false);
    // The malformed short-circuit means we never called NVD.
    assert.equal(nvd.calls.length, 0);
    // And we did not write a cache row.
    const cached = await client.execute({ sql: `SELECT 1 FROM cve_cache WHERE cve_id = ?`, args: ["CVE-BAD"] });
    assert.equal(cached.rows.length, 0);
  });
});

describe("cveExists", () => {
  it("returns true when NVD reports the CVE exists", async () => {
    const nvd = mockNvd({
      "CVE-2026-1234": { exists: true, cvssV31: null, severity: null, summary: null, rawJson: null },
    });
    assert.equal(await cveExists("CVE-2026-1234", { client, nvd }), true);
  });

  it("returns false when NVD reports the CVE does not exist", async () => {
    const nvd = mockNvd({});
    assert.equal(await cveExists("CVE-2099-9999", { client, nvd }), false);
  });
});
