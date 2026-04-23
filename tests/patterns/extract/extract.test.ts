import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type { AnthropicClient, MessagesCreateParams, MessagesCreateResult } from "../../../src/clients/anthropic.ts";
import { runPattern, resetPatternCaches } from "../../../src/patterns/runner.ts";
import { EXTRACT_PATTERN } from "../../../src/patterns/registry.ts";
import { validate, type JsonSchema, type JsonValue } from "../../../src/patterns/validator.ts";
import { ALL_EXTRACT_FIXTURES } from "./fixtures.ts";

function mockClient(response: string): { client: AnthropicClient; calls: MessagesCreateParams[] } {
  const calls: MessagesCreateParams[] = [];
  return {
    calls,
    client: {
      async messagesCreate(params): Promise<MessagesCreateResult> {
        calls.push(params);
        return { text: response, usage: { input_tokens: 100, output_tokens: 200 }, model: params.model };
      },
    },
  };
}

beforeEach(() => resetPatternCaches());

describe("extract pattern: schema round-trip", () => {
  it("accepts every expected output in the fixture set", async () => {
    const schema = JSON.parse(await readFile("patterns/extract/schema.json", "utf-8")) as JsonSchema;
    for (const f of ALL_EXTRACT_FIXTURES) {
      const errs = validate(schema, f.expectedOutput as unknown as JsonValue);
      assert.deepEqual(errs, [], `${f.name}: ${JSON.stringify(errs)}`);
    }
  });

  it("rejects output missing a required impact sub-field", async () => {
    const schema = JSON.parse(await readFile("patterns/extract/schema.json", "utf-8")) as JsonSchema;
    const expected = ALL_EXTRACT_FIXTURES[0]!.expectedOutput;
    const bad = structuredClone(expected) as unknown as { impact: Record<string, unknown> };
    delete bad.impact.data_exfil_size;
    const errs = validate(schema, bad as unknown as JsonValue);
    assert.ok(errs.length >= 1);
  });

  it("rejects output with an unknown confidence value", async () => {
    const schema = JSON.parse(await readFile("patterns/extract/schema.json", "utf-8")) as JsonSchema;
    const expected = ALL_EXTRACT_FIXTURES[0]!.expectedOutput;
    const bad = { ...expected, confidence: "maybe" } as unknown as JsonValue;
    const errs = validate(schema, bad);
    assert.ok(errs.some((e) => e.path === "$.confidence"));
  });
});

describe("extract pattern: runner end-to-end", () => {
  for (const f of ALL_EXTRACT_FIXTURES) {
    it(f.name, async () => {
      const { client, calls } = mockClient(f.mockedResponse);
      const r = await runPattern(EXTRACT_PATTERN, f.input, {
        anthropic: client,
        env: { MODEL_EXTRACTION: "claude-haiku-4-5" },
      });
      assert.deepEqual(r.output, f.expectedOutput);
      assert.equal(r.retries, 0);
      assert.equal(calls.length, 1);
      assert.match(calls[0]!.system, /CHUNK_INDEX:/);
      // Placeholder substitution happened.
      assert.match(calls[0]!.system, new RegExp(f.input.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    });
  }
});
