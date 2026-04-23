import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createBraveClient, countByTier } from "../../src/clients/brave.ts";

describe("brave client: graceful degradation", () => {
  it("returns empty when no API key is configured", async () => {
    const client = createBraveClient({ apiKey: undefined, fetch: async () => new Response("{}") });
    const r = await client.search("any");
    assert.deepEqual(r, []);
  });

  it("returns empty on non-2xx response (silent, corroboration is display-only)", async () => {
    let called = 0;
    const client = createBraveClient({
      apiKey: "k",
      fetch: async () => {
        called++;
        return new Response("rate limited", { status: 429 });
      },
    });
    const r = await client.search("any");
    assert.deepEqual(r, []);
    assert.equal(called, 1);
  });

  it("returns empty on network error", async () => {
    const client = createBraveClient({
      apiKey: "k",
      fetch: async () => {
        throw new Error("ENOTFOUND");
      },
    });
    const r = await client.search("any");
    assert.deepEqual(r, []);
  });
});

describe("brave client: parsing", () => {
  it("extracts url, title, and hostname from each result", async () => {
    const body = {
      web: {
        results: [
          { url: "https://krebsonsecurity.com/2026/x", title: "Headline A" },
          { url: "https://www.bleepingcomputer.com/y", title: "Headline B" },
        ],
      },
    };
    const client = createBraveClient({
      apiKey: "k",
      fetch: async () => new Response(JSON.stringify(body), { status: 200 }),
    });
    const r = await client.search("any");
    assert.deepEqual(r.map((x) => x.hostname), ["krebsonsecurity.com", "www.bleepingcomputer.com"]);
  });
});

describe("countByTier", () => {
  const tier1 = ["krebsonsecurity.com", "therecord.media"];
  const tier2 = ["bleepingcomputer.com", "darkreading.com"];

  it("matches exact hostnames", () => {
    const c = countByTier(
      [
        { url: "https://krebsonsecurity.com/x", title: "", hostname: "krebsonsecurity.com" },
        { url: "https://darkreading.com/y", title: "", hostname: "darkreading.com" },
      ],
      tier1,
      tier2,
    );
    assert.deepEqual(c, { tier1: 1, tier2: 1 });
  });

  it("matches subdomains (www.bleepingcomputer.com counts for bleepingcomputer.com)", () => {
    const c = countByTier(
      [{ url: "", title: "", hostname: "www.bleepingcomputer.com" }],
      tier1,
      tier2,
    );
    assert.deepEqual(c, { tier1: 0, tier2: 1 });
  });

  it("deduplicates duplicate hostnames", () => {
    const c = countByTier(
      [
        { url: "https://krebsonsecurity.com/a", title: "", hostname: "krebsonsecurity.com" },
        { url: "https://krebsonsecurity.com/b", title: "", hostname: "krebsonsecurity.com" },
      ],
      tier1,
      tier2,
    );
    assert.deepEqual(c, { tier1: 1, tier2: 0 });
  });

  it("ignores hosts not in either tier", () => {
    const c = countByTier(
      [{ url: "", title: "", hostname: "random-blog.example" }],
      tier1,
      tier2,
    );
    assert.deepEqual(c, { tier1: 0, tier2: 0 });
  });
});
