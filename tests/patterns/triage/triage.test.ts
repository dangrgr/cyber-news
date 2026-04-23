import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type { AnthropicClient, MessagesCreateParams, MessagesCreateResult } from "../../../src/clients/anthropic.ts";
import { runPattern, resetPatternCaches } from "../../../src/patterns/runner.ts";
import { TRIAGE_PATTERN } from "../../../src/patterns/registry.ts";
import { validate, type JsonSchema } from "../../../src/patterns/validator.ts";
import { ALL_FIXTURES } from "./fixtures.ts";

function mockClient(response: string): { client: AnthropicClient; calls: MessagesCreateParams[] } {
  const calls: MessagesCreateParams[] = [];
  return {
    calls,
    client: {
      async messagesCreate(params): Promise<MessagesCreateResult> {
        calls.push(params);
        return { text: response, usage: { input_tokens: 100, output_tokens: 50 }, model: params.model };
      },
    },
  };
}

beforeEach(() => resetPatternCaches());

describe("triage pattern: schema round-trip", () => {
  it("accepts every expected output in the fixture set", async () => {
    const raw = await readFile("patterns/triage/schema.json", "utf-8");
    const schema = JSON.parse(raw) as JsonSchema;
    for (const f of ALL_FIXTURES) {
      const errs = validate(schema, f.expectedOutput as unknown as import("../../../src/patterns/validator.ts").JsonValue);
      assert.deepEqual(errs, [], `${f.name}: ${JSON.stringify(errs)}`);
    }
  });

  it("rejects a shape with a hallucinated field", async () => {
    const raw = await readFile("patterns/triage/schema.json", "utf-8");
    const schema = JSON.parse(raw) as JsonSchema;
    const bad = {
      decision: "process",
      novel: true,
      significant: true,
      duplicate_of: null,
      reason: "...",
      confidence: "high", // not in the schema
    };
    const errs = validate(schema, bad as unknown as import("../../../src/patterns/validator.ts").JsonValue);
    assert.ok(errs.length >= 1, "expected at least one error for extra field");
  });
});

describe("triage pattern: runner end-to-end against real pattern.md + schema.json", () => {
  for (const f of ALL_FIXTURES) {
    it(f.name, async () => {
      const { client, calls } = mockClient(f.mockedResponse);
      const r = await runPattern(TRIAGE_PATTERN, f.input, {
        anthropic: client,
        env: { MODEL_TRIAGE: "claude-haiku-4-5" },
      });
      assert.deepEqual(r.output, f.expectedOutput);
      assert.equal(r.retries, 0);
      assert.equal(calls.length, 1);
      // System prompt carries all placeholders substituted.
      assert.match(calls[0]!.system, new RegExp(escapeRegex(f.input.title)));
      assert.match(calls[0]!.system, new RegExp(escapeRegex(f.input.url)));
      assert.match(calls[0]!.system, new RegExp(escapeRegex(f.input.source)));
      // Ensure the literal JSON-schema-block in the prompt was NOT substituted away.
      assert.match(calls[0]!.system, /"decision": "process" \| "skip"/);
    });
  }
});

describe("triage pattern: template leaves literal JSON in prompt alone", () => {
  it("does not mangle the braces in the example output block", async () => {
    const { client, calls } = mockClient(
      JSON.stringify({
        decision: "skip",
        novel: false,
        significant: false,
        duplicate_of: null,
        reason: "x",
      }),
    );
    await runPattern(TRIAGE_PATTERN, ALL_FIXTURES[0]!.input, {
      anthropic: client,
      env: { MODEL_TRIAGE: "claude-haiku-4-5" },
    });
    const system = calls[0]!.system;
    // The example output block with JSON braces must survive verbatim.
    assert.match(system, /"decision": "process" \| "skip"/);
    assert.match(system, /"duplicate_of": string \| null/);
  });
});

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
