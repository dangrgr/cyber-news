import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type { AnthropicClient, MessagesCreateParams } from "../../../src/clients/anthropic.ts";
import { runPattern, resetPatternCaches } from "../../../src/patterns/runner.ts";
import { FACTCHECK_PATTERN } from "../../../src/patterns/registry.ts";
import { validate, type JsonSchema, type JsonValue } from "../../../src/patterns/validator.ts";

function mockClient(response: string): { client: AnthropicClient; calls: MessagesCreateParams[] } {
  const calls: MessagesCreateParams[] = [];
  return {
    calls,
    client: {
      async messagesCreate(params) {
        calls.push(params);
        return { text: response, usage: { input_tokens: 100, output_tokens: 50 }, model: params.model };
      },
    },
  };
}

beforeEach(() => resetPatternCaches());

describe("factcheck schema", () => {
  it("accepts a clean pass", async () => {
    const schema = JSON.parse(await readFile("patterns/factcheck/schema.json", "utf-8")) as JsonSchema;
    const val: JsonValue = { overall: "pass", issues: [] };
    assert.deepEqual(validate(schema, val), []);
  });

  it("accepts a fail with one OVERREACH issue", async () => {
    const schema = JSON.parse(await readFile("patterns/factcheck/schema.json", "utf-8")) as JsonSchema;
    const val: JsonValue = {
      overall: "fail",
      issues: [
        {
          field: "confidence",
          verdict: "OVERREACH",
          article_evidence: "the article says 'claims'",
          detail: "confidence set to confirmed despite claim markers",
        },
      ],
    };
    assert.deepEqual(validate(schema, val), []);
  });

  it("rejects an unknown verdict value", async () => {
    const schema = JSON.parse(await readFile("patterns/factcheck/schema.json", "utf-8")) as JsonSchema;
    const val: JsonValue = {
      overall: "fail",
      issues: [
        { field: "summary", verdict: "SUSPICIOUS", article_evidence: null, detail: "..." },
      ],
    };
    const errs = validate(schema, val);
    assert.ok(errs.some((e) => e.path.includes("verdict")));
  });
});

describe("factcheck pattern runner", () => {
  it("returns a structured issues list end-to-end", async () => {
    const mockedResponse = JSON.stringify({
      overall: "fail",
      issues: [
        {
          field: "confidence",
          verdict: "OVERREACH",
          article_evidence: "ShinyHunters claims...",
          detail: "claim markers present but confidence=confirmed",
        },
      ],
    });
    const { client, calls } = mockClient(mockedResponse);
    const r = await runPattern(
      FACTCHECK_PATTERN,
      {
        raw_text: "ShinyHunters claims to have breached Cisco.",
        extraction_json: JSON.stringify({ confidence: "confirmed", victim_orgs_confirmed: ["Cisco"] }),
      },
      { anthropic: client, env: { MODEL_FACTCHECK: "claude-haiku-4-5" } },
    );
    assert.equal(r.output.overall, "fail");
    assert.equal(r.output.issues.length, 1);
    assert.equal(r.output.issues[0]!.verdict, "OVERREACH");
    assert.equal(calls.length, 1);
    assert.match(calls[0]!.system, /ShinyHunters claims/);
  });
});
