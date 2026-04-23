import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createDiscordClient } from "../../src/clients/discord.ts";

interface RecordedCall {
  url: string;
  method: string;
  body: string;
}

function recorder(responses: Array<() => Response>): {
  fetch: typeof globalThis.fetch;
  calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];
  let i = 0;
  return {
    calls,
    fetch: async (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      calls.push({ url, method: init?.method ?? "GET", body: String(init?.body ?? "") });
      const r = responses[i]!();
      i++;
      return r;
    },
  };
}

describe("discord client: postMessage", () => {
  it("POSTs to webhook?wait=true and returns the returned message id", async () => {
    const r = recorder([
      () => new Response(JSON.stringify({ id: "msg-abc" }), { status: 200 }),
    ]);
    const client = createDiscordClient({
      webhookUrl: "https://discord.com/api/webhooks/X/Y",
      fetch: r.fetch,
    });
    const result = await client.postMessage({ embeds: [{ title: "t" }] });
    assert.equal(result.messageId, "msg-abc");
    assert.equal(r.calls[0]!.method, "POST");
    assert.match(r.calls[0]!.url, /wait=true$/);
  });

  it("retries once on 500 then succeeds", async () => {
    const r = recorder([
      () => new Response("", { status: 500 }),
      () => new Response(JSON.stringify({ id: "msg-retry" }), { status: 200 }),
    ]);
    const client = createDiscordClient({
      webhookUrl: "https://discord.com/api/webhooks/X/Y",
      fetch: r.fetch,
      sleep: async () => {},
    });
    const result = await client.postMessage({ content: "hi" });
    assert.equal(result.messageId, "msg-retry");
    assert.equal(r.calls.length, 2);
  });

  it("throws when retries are exhausted", async () => {
    const r = recorder([
      () => new Response("", { status: 500 }),
      () => new Response("", { status: 500 }),
    ]);
    const client = createDiscordClient({
      webhookUrl: "https://discord.com/api/webhooks/X/Y",
      fetch: r.fetch,
      sleep: async () => {},
      maxRetries: 1,
    });
    await assert.rejects(client.postMessage({ content: "hi" }), /discord POST failed/);
  });
});

describe("discord client: patchMessage", () => {
  it("PATCHes /messages/{id} without ?wait", async () => {
    const r = recorder([() => new Response(null, { status: 204 })]);
    const client = createDiscordClient({
      webhookUrl: "https://discord.com/api/webhooks/X/Y",
      fetch: r.fetch,
    });
    await client.patchMessage("msg-abc", { embeds: [{ title: "updated" }] });
    assert.equal(r.calls[0]!.method, "PATCH");
    assert.match(r.calls[0]!.url, /\/messages\/msg-abc$/);
    assert.doesNotMatch(r.calls[0]!.url, /wait=/);
  });
});
