import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import type { AnthropicClient, MessagesCreateParams, MessagesCreateResult } from "../../src/clients/anthropic.ts";
import {
  runPattern,
  resetPatternCaches,
  PatternMalformedJsonError,
  PatternSchemaError,
  PatternModelNotConfiguredError,
  type PatternDefinition,
} from "../../src/patterns/runner.ts";

interface DemoInput { name: string; }
interface DemoOutput { decision: "process" | "skip"; reason: string; }

const DEMO_PATTERN: PatternDefinition<DemoInput, DemoOutput> = {
  name: "triage",
  promptPath: "patterns/triage/pattern.md",
  schemaPath: "patterns/triage/schema.json",
  modelEnvVar: "MODEL_TRIAGE",
  buildPlaceholders: (i) => ({ name: i.name }),
};

const DEMO_PROMPT = "Classify for {name}.";
const DEMO_SCHEMA = JSON.stringify({
  type: "object",
  required: ["decision", "reason"],
  properties: {
    decision: { enum: ["process", "skip"] },
    reason: { type: "string" },
  },
  additionalProperties: false,
});

function fixtureReadFile(map: Record<string, string>): (p: string) => Promise<string> {
  return async (p) => {
    if (!(p in map)) throw new Error(`unexpected readFile: ${p}`);
    return map[p]!;
  };
}

function mockClient(responses: string[]): { client: AnthropicClient; calls: MessagesCreateParams[] } {
  const calls: MessagesCreateParams[] = [];
  let i = 0;
  return {
    calls,
    client: {
      async messagesCreate(params: MessagesCreateParams): Promise<MessagesCreateResult> {
        calls.push(params);
        if (i >= responses.length) throw new Error(`unexpected call #${i + 1}`);
        const text = responses[i]!;
        i++;
        return { text, usage: { input_tokens: 100, output_tokens: 50 }, model: params.model };
      },
    },
  };
}

beforeEach(() => resetPatternCaches());

describe("runPattern: happy path", () => {
  it("returns parsed output on clean JSON with no retries", async () => {
    const { client, calls } = mockClient([JSON.stringify({ decision: "process", reason: "ok" })]);
    const r = await runPattern(DEMO_PATTERN, { name: "Stryker" }, {
      anthropic: client,
      readFile: fixtureReadFile({
        "patterns/triage/pattern.md": DEMO_PROMPT,
        "patterns/triage/schema.json": DEMO_SCHEMA,
      }),
      env: { MODEL_TRIAGE: "claude-haiku-4-5" },
    });
    assert.equal(r.retries, 0);
    assert.deepEqual(r.output, { decision: "process", reason: "ok" });
    assert.equal(r.usage.model, "claude-haiku-4-5");
    assert.equal(calls.length, 1);
    assert.match(calls[0]!.system, /Classify for Stryker\./);
  });

  it("strips a single JSON code fence if the model adds one", async () => {
    const fenced = "```json\n" + JSON.stringify({ decision: "skip", reason: "vendor marketing" }) + "\n```";
    const { client } = mockClient([fenced]);
    const r = await runPattern(DEMO_PATTERN, { name: "X" }, {
      anthropic: client,
      readFile: fixtureReadFile({
        "patterns/triage/pattern.md": DEMO_PROMPT,
        "patterns/triage/schema.json": DEMO_SCHEMA,
      }),
      env: { MODEL_TRIAGE: "claude-haiku-4-5" },
    });
    assert.equal(r.retries, 0);
    assert.equal(r.output.decision, "skip");
  });
});

describe("runPattern: retry on malformed JSON", () => {
  it("retries once with a follow-up nudge and succeeds", async () => {
    const { client, calls } = mockClient([
      "I think this should be processed.",
      JSON.stringify({ decision: "process", reason: "fine on retry" }),
    ]);
    const r = await runPattern(DEMO_PATTERN, { name: "X" }, {
      anthropic: client,
      readFile: fixtureReadFile({
        "patterns/triage/pattern.md": DEMO_PROMPT,
        "patterns/triage/schema.json": DEMO_SCHEMA,
      }),
      env: { MODEL_TRIAGE: "claude-haiku-4-5" },
    });
    assert.equal(r.retries, 1);
    assert.equal(r.output.decision, "process");
    assert.equal(calls.length, 2);
    const followup = calls[1]!.messages[calls[1]!.messages.length - 1]!;
    assert.match(followup.content, /raw JSON only/);
  });

  it("throws PatternMalformedJsonError after one failed retry", async () => {
    const { client } = mockClient(["nope", "still not JSON"]);
    await assert.rejects(
      runPattern(DEMO_PATTERN, { name: "X" }, {
        anthropic: client,
        readFile: fixtureReadFile({
          "patterns/triage/pattern.md": DEMO_PROMPT,
          "patterns/triage/schema.json": DEMO_SCHEMA,
        }),
        env: { MODEL_TRIAGE: "claude-haiku-4-5" },
      }),
      (e: unknown) => e instanceof PatternMalformedJsonError,
    );
  });
});

describe("runPattern: schema violations", () => {
  it("throws PatternSchemaError without a retry when JSON is parseable but wrong shape", async () => {
    const { client, calls } = mockClient([JSON.stringify({ decision: "process" })]); // missing 'reason'
    await assert.rejects(
      runPattern(DEMO_PATTERN, { name: "X" }, {
        anthropic: client,
        readFile: fixtureReadFile({
          "patterns/triage/pattern.md": DEMO_PROMPT,
          "patterns/triage/schema.json": DEMO_SCHEMA,
        }),
        env: { MODEL_TRIAGE: "claude-haiku-4-5" },
      }),
      (e: unknown) => e instanceof PatternSchemaError,
    );
    assert.equal(calls.length, 1, "should not retry on schema error");
  });

  it("throws PatternSchemaError on hallucinated extra fields", async () => {
    const extra = JSON.stringify({ decision: "process", reason: "ok", confidence: "high" });
    const { client } = mockClient([extra]);
    await assert.rejects(
      runPattern(DEMO_PATTERN, { name: "X" }, {
        anthropic: client,
        readFile: fixtureReadFile({
          "patterns/triage/pattern.md": DEMO_PROMPT,
          "patterns/triage/schema.json": DEMO_SCHEMA,
        }),
        env: { MODEL_TRIAGE: "claude-haiku-4-5" },
      }),
      PatternSchemaError,
    );
  });
});

describe("runPattern: configuration errors", () => {
  it("throws PatternModelNotConfiguredError when model env var is missing", async () => {
    const { client } = mockClient([]);
    await assert.rejects(
      runPattern(DEMO_PATTERN, { name: "X" }, {
        anthropic: client,
        readFile: fixtureReadFile({
          "patterns/triage/pattern.md": DEMO_PROMPT,
          "patterns/triage/schema.json": DEMO_SCHEMA,
        }),
        env: {},
      }),
      PatternModelNotConfiguredError,
    );
  });
});
