import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { renderTemplate } from "../../src/patterns/template.ts";

describe("renderTemplate", () => {
  it("substitutes simple snake_case keys", () => {
    assert.equal(
      renderTemplate("Hello {name}, your id is {user_id}.", { name: "Dan", user_id: "42" }),
      "Hello Dan, your id is 42.",
    );
  });

  it("throws on missing keys, reporting all of them", () => {
    assert.throws(
      () => renderTemplate("a={a} b={b} c={c}", { a: "1" }),
      /missing keys: b, c/,
    );
  });

  it("ignores JSON-looking braces that aren't snake_case placeholders", () => {
    // PRD §10 prompts embed literal JSON examples like {"decision": "process"}.
    // Those should pass through untouched so pattern.md stays diffable.
    const prompt = 'Return: {"decision": "process" | "skip"}\nFor user {user_id}.';
    assert.equal(
      renderTemplate(prompt, { user_id: "42" }),
      'Return: {"decision": "process" | "skip"}\nFor user 42.',
    );
  });

  it("leaves unrelated braces alone (UPPERCASE, digits-first)", () => {
    const out = renderTemplate("{NOT_ME} and {1bad} and {good}", { good: "yes" });
    assert.equal(out, "{NOT_ME} and {1bad} and yes");
  });

  it("supports multiple occurrences of the same key", () => {
    assert.equal(renderTemplate("{x}-{x}-{x}", { x: "a" }), "a-a-a");
  });

  it("deduplicates keys in the missing-keys error message", () => {
    assert.throws(
      () => renderTemplate("{missing} {missing}", {}),
      /missing keys: missing$/,
    );
  });
});
