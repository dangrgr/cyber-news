import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createNvdClient } from "../../src/clients/nvd.ts";

function fakeFetch(handlers: Array<() => Response>): typeof globalThis.fetch {
  let i = 0;
  return async (_input, _init) => {
    if (i >= handlers.length) throw new Error(`unexpected fetch #${i + 1}`);
    const r = handlers[i]!();
    i++;
    return r;
  };
}

describe("NVD client: parsing", () => {
  it("returns exists=true and a CVSS score for a known CVE", async () => {
    const body = {
      vulnerabilities: [
        {
          cve: {
            descriptions: [{ lang: "en", value: "Use-after-free in example.dll." }],
            metrics: {
              cvssMetricV31: [
                { cvssData: { baseScore: 9.8, baseSeverity: "CRITICAL" } },
              ],
            },
          },
        },
      ],
    };
    const client = createNvdClient({
      fetch: fakeFetch([() => new Response(JSON.stringify(body), { status: 200 })]),
      sleep: async () => {},
    });
    const r = await client.lookup("CVE-2026-1234");
    assert.equal(r.exists, true);
    assert.equal(r.cvssV31, 9.8);
    assert.equal(r.severity, "CRITICAL");
  });

  it("returns exists=false on 404", async () => {
    const client = createNvdClient({
      fetch: fakeFetch([() => new Response("", { status: 404 })]),
      sleep: async () => {},
    });
    const r = await client.lookup("CVE-2099-9999");
    assert.equal(r.exists, false);
  });

  it("returns exists=false when vulnerabilities array is empty", async () => {
    const client = createNvdClient({
      fetch: fakeFetch([() => new Response(JSON.stringify({ vulnerabilities: [] }), { status: 200 })]),
      sleep: async () => {},
    });
    const r = await client.lookup("CVE-2026-1");
    assert.equal(r.exists, false);
  });
});

describe("NVD client: 429 handling", () => {
  it("honors Retry-After and succeeds on the retry", async () => {
    const slept: number[] = [];
    const client = createNvdClient({
      fetch: fakeFetch([
        () => new Response("", { status: 429, headers: { "retry-after": "1" } }),
        () =>
          new Response(
            JSON.stringify({ vulnerabilities: [{ cve: { descriptions: [{ lang: "en", value: "ok" }] } }] }),
            { status: 200 },
          ),
      ]),
      sleep: async (ms: number) => {
        slept.push(ms);
      },
      minIntervalMs: 0,
    });
    const r = await client.lookup("CVE-2026-1234");
    assert.equal(r.exists, true);
    assert.ok(slept.includes(1000), `expected 1000ms sleep after Retry-After: ${slept.join(",")}`);
  });

  it("gracefully degrades after maxRetries: returns exists=true + rateLimited flag", async () => {
    const client = createNvdClient({
      fetch: fakeFetch([
        () => new Response("", { status: 429, headers: { "retry-after": "1" } }),
        () => new Response("", { status: 429, headers: { "retry-after": "1" } }),
        () => new Response("", { status: 429, headers: { "retry-after": "1" } }),
      ]),
      sleep: async () => {},
      minIntervalMs: 0,
      maxRetries: 2,
    });
    const r = await client.lookup("CVE-2026-1234");
    assert.equal(r.exists, true, "graceful degrade: treat as exists so factcheck doesn't false-fail");
    assert.equal(r.rateLimited, true);
  });
});

describe("NVD client: client-side throttle", () => {
  it("sleeps to maintain min-interval between consecutive calls", async () => {
    const slept: number[] = [];
    let t = 1_000_000;
    const client = createNvdClient({
      fetch: fakeFetch([
        () => new Response(JSON.stringify({ vulnerabilities: [] }), { status: 200 }),
        () => new Response(JSON.stringify({ vulnerabilities: [] }), { status: 200 }),
      ]),
      sleep: async (ms: number) => {
        slept.push(ms);
        t += ms; // simulate time passing during the sleep
      },
      now: () => t,
      minIntervalMs: 6500,
    });
    await client.lookup("CVE-2026-1111");
    // Second call immediately after should force a ~6500ms sleep.
    await client.lookup("CVE-2026-2222");
    assert.ok(slept.length > 0);
    assert.ok(slept.some((ms) => ms >= 6000), `expected ~6500ms sleep, got [${slept.join(",")}]`);
  });

  it("does not sleep if enough time has already passed", async () => {
    const slept: number[] = [];
    let t = 1_000_000;
    const client = createNvdClient({
      fetch: fakeFetch([
        () => new Response(JSON.stringify({ vulnerabilities: [] }), { status: 200 }),
        () => new Response(JSON.stringify({ vulnerabilities: [] }), { status: 200 }),
      ]),
      sleep: async (ms: number) => { slept.push(ms); },
      now: () => t,
      minIntervalMs: 6500,
    });
    await client.lookup("CVE-2026-1111");
    t += 10_000; // simulate 10s of real-world work between calls
    await client.lookup("CVE-2026-2222");
    assert.equal(slept.length, 0, "second call needed no throttle sleep");
  });
});
