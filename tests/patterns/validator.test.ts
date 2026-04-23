import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validate, type JsonSchema } from "../../src/patterns/validator.ts";

describe("validator: type checks", () => {
  it("accepts a valid string", () => {
    assert.deepEqual(validate({ type: "string" }, "hello"), []);
  });

  it("rejects wrong types with a path", () => {
    const errs = validate({ type: "string" }, 42);
    assert.equal(errs.length, 1);
    assert.match(errs[0]!.message, /expected type string/);
    assert.equal(errs[0]!.path, "$");
  });

  it("accepts a nullable union", () => {
    const schema: JsonSchema = { type: ["string", "null"] };
    assert.deepEqual(validate(schema, null), []);
    assert.deepEqual(validate(schema, "x"), []);
  });

  it("distinguishes integer from number", () => {
    assert.deepEqual(validate({ type: "integer" }, 3), []);
    assert.equal(validate({ type: "integer" }, 3.5).length, 1);
  });
});

describe("validator: objects", () => {
  const schema: JsonSchema = {
    type: "object",
    required: ["a", "b"],
    properties: {
      a: { type: "string" },
      b: { type: "integer" },
    },
    additionalProperties: false,
  };

  it("accepts a well-formed object", () => {
    assert.deepEqual(validate(schema, { a: "x", b: 1 }), []);
  });

  it("flags missing required keys", () => {
    const errs = validate(schema, { a: "x" });
    assert.equal(errs.length, 1);
    assert.equal(errs[0]!.path, "$.b");
    assert.equal(errs[0]!.message, "required");
  });

  it("flags additional properties when disallowed", () => {
    const errs = validate(schema, { a: "x", b: 1, c: "nope" });
    assert.equal(errs.length, 1);
    assert.equal(errs[0]!.path, "$.c");
    assert.match(errs[0]!.message, /additional property/);
  });

  it("validates nested property types", () => {
    const errs = validate(schema, { a: 9, b: 1 });
    assert.equal(errs.length, 1);
    assert.equal(errs[0]!.path, "$.a");
  });
});

describe("validator: arrays", () => {
  const schema: JsonSchema = { type: "array", items: { type: "string" } };

  it("accepts a homogeneous array", () => {
    assert.deepEqual(validate(schema, ["a", "b"]), []);
  });

  it("reports element path on failure", () => {
    const errs = validate(schema, ["a", 2, "c"]);
    assert.equal(errs.length, 1);
    assert.equal(errs[0]!.path, "$[1]");
  });
});

describe("validator: enums", () => {
  const schema: JsonSchema = { enum: ["process", "skip"] };

  it("accepts allowed values", () => {
    assert.deepEqual(validate(schema, "process"), []);
    assert.deepEqual(validate(schema, "skip"), []);
  });

  it("rejects disallowed values", () => {
    assert.equal(validate(schema, "other").length, 1);
  });
});

describe("validator: nested triage-like shape", () => {
  const schema: JsonSchema = {
    type: "object",
    required: ["decision", "novel", "significant", "duplicate_of", "reason"],
    properties: {
      decision: { enum: ["process", "skip"] },
      novel: { type: "boolean" },
      significant: { type: "boolean" },
      duplicate_of: { type: ["string", "null"] },
      reason: { type: "string" },
    },
    additionalProperties: false,
  };

  it("accepts a realistic triage output", () => {
    assert.deepEqual(
      validate(schema, {
        decision: "process",
        novel: true,
        significant: true,
        duplicate_of: null,
        reason: "Named victim and attribution.",
      }),
      [],
    );
  });

  it("flags a stray hallucinated field", () => {
    const errs = validate(schema, {
      decision: "process",
      novel: true,
      significant: true,
      duplicate_of: null,
      reason: "...",
      confidence: "high",
    });
    assert.equal(errs.length, 1);
    assert.equal(errs[0]!.path, "$.confidence");
  });
});
