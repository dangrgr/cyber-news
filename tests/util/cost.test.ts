import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_HAIKU_RATES,
  DEFAULT_SONNET_RATES,
  computeCost,
  ratesForModel,
} from "../../src/util/cost.ts";

describe("computeCost", () => {
  it("computes input + output cost at the given rates", () => {
    // 1M input @ $3/M + 1M output @ $15/M = $18
    assert.equal(computeCost(1_000_000, 1_000_000, DEFAULT_SONNET_RATES), 18);
  });

  it("returns 0 for zero tokens", () => {
    assert.equal(computeCost(0, 0, DEFAULT_HAIKU_RATES), 0);
  });

  it("scales linearly", () => {
    const a = computeCost(100_000, 50_000, DEFAULT_HAIKU_RATES);
    const b = computeCost(200_000, 100_000, DEFAULT_HAIKU_RATES);
    // floating-point safe equality
    assert.ok(Math.abs(b - 2 * a) < 1e-9);
  });

  it("handles fractional tokens", () => {
    // 1000 input @ $1/M + 500 output @ $5/M = $0.001 + $0.0025 = $0.0035
    const cost = computeCost(1000, 500, DEFAULT_HAIKU_RATES);
    assert.ok(Math.abs(cost - 0.0035) < 1e-9);
  });
});

describe("ratesForModel", () => {
  it("picks Haiku rates for Haiku model ids", () => {
    assert.deepEqual(ratesForModel("claude-haiku-4-5"), DEFAULT_HAIKU_RATES);
    assert.deepEqual(ratesForModel("claude-haiku-4-5-20251001"), DEFAULT_HAIKU_RATES);
  });

  it("picks Sonnet rates for Sonnet model ids", () => {
    assert.deepEqual(ratesForModel("claude-sonnet-4-6"), DEFAULT_SONNET_RATES);
  });

  it("defaults to Sonnet rates for unknown models (safer over-estimate)", () => {
    assert.deepEqual(ratesForModel("claude-opus-4-7"), DEFAULT_SONNET_RATES);
    assert.deepEqual(ratesForModel("anything-else"), DEFAULT_SONNET_RATES);
  });

  it("is case-insensitive for the haiku substring", () => {
    assert.deepEqual(ratesForModel("Claude-HAIKU-4-5"), DEFAULT_HAIKU_RATES);
  });
});
