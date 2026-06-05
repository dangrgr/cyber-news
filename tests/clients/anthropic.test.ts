import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readClaudeCodeAccessToken, resolveAnthropicAuthOptions } from "../../src/clients/anthropic.ts";

const tmpDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function writeCredentials(credentials: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "cyber-news-claude-config-"));
  tmpDirs.push(dir);
  writeFileSync(join(dir, ".credentials.json"), JSON.stringify(credentials));
  return dir;
}

describe("resolveAnthropicAuthOptions", () => {
  it("uses bearer OAuth token and rejects API keys when LLM_AUTH_MODE=oauth", () => {
    const opts = resolveAnthropicAuthOptions({
      LLM_AUTH_MODE: "oauth",
      ANTHROPIC_AUTH_TOKEN: "oauth-token",
    });

    assert.deepEqual(opts, { apiKey: null, authToken: "oauth-token" });
  });

  it("uses Claude Code access token from CLAUDE_CONFIG_DIR when ANTHROPIC_AUTH_TOKEN is unset", () => {
    const configDir = writeCredentials({
      claudeAiOauth: { accessToken: "claude-code-access", expiresAt: Date.now() + 60 * 60 * 1000 },
    });

    const opts = resolveAnthropicAuthOptions({ LLM_AUTH_MODE: "oauth", CLAUDE_CONFIG_DIR: configDir });

    assert.deepEqual(opts, { apiKey: null, authToken: "claude-code-access" });
  });

  it("fails closed when Claude Code credentials are expired or inside refresh buffer", () => {
    const configDir = writeCredentials({ claudeAiOauth: { accessToken: "expired", expiresAt: 1_000 } });

    assert.throws(
      () => readClaudeCodeAccessToken({ CLAUDE_CONFIG_DIR: configDir }, 1_000),
      /expired or within the 5 minute refresh buffer/,
    );
  });

  it("fails closed if oauth mode has no ANTHROPIC_AUTH_TOKEN or readable Claude config", () => {
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
