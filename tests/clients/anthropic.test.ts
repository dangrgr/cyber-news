import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveAnthropicAuthOptions } from "../../src/clients/anthropic.ts";

describe("resolveAnthropicAuthOptions", () => {
  it("uses bearer OAuth token and rejects API keys when LLM_AUTH_MODE=oauth", () => {
    const opts = resolveAnthropicAuthOptions({
      LLM_AUTH_MODE: "oauth",
      ANTHROPIC_AUTH_TOKEN: "oauth-token",
    });

    assert.deepEqual(opts, { apiKey: null, authToken: "oauth-token" });
  });

  it("fails closed if oauth mode has no ANTHROPIC_AUTH_TOKEN", () => {
    assert.throws(
      () => resolveAnthropicAuthOptions({ LLM_AUTH_MODE: "oauth" }),
      /ANTHROPIC_AUTH_TOKEN is required/,
    );
  });

  it("fails closed if oauth mode also exposes ANTHROPIC_API_KEY", () => {
    assert.throws(
      () =>
        resolveAnthropicAuthOptions({
          LLM_AUTH_MODE: "oauth",
          ANTHROPIC_AUTH_TOKEN: "oauth-token",
          ANTHROPIC_API_KEY: "api-key",
        }),
      /ANTHROPIC_API_KEY must be unset/,
    );
  });

  it("preserves default SDK API-key behavior outside oauth mode", () => {
    const opts = resolveAnthropicAuthOptions({ ANTHROPIC_API_KEY: "api-key" });
    assert.deepEqual(opts, { apiKey: "api-key", authToken: null });
  });
});
