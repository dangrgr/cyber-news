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

describe("NVD client: 429 retry", () => {
  it("honors Retry-After and succeeds on the retry", async () => {
    let sleptMs = 0;
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
        sleptMs = ms;
      },
    });
    const r = await client.lookup("CVE-2026-1");
    assert.equal(r.exists, true);
    assert.equal(sleptMs, 1000);
  });

  it("gives up after maxRetries and throws", async () => {
    const client = createNvdClient({
      fetch: fakeFetch([
        () => new Response("", { status: 429, headers: { "retry-after": "1" } }),
        () => new Response("", { status: 429, headers: { "retry-after": "1" } }),
        () => new Response("", { status: 429, headers: { "retry-after": "1" } }),
      ]),
      sleep: async () => {},
      maxRetries: 2,
    });
    await assert.rejects(client.lookup("CVE-2026-1"), /429/);
  });
});
