// Thin wrapper over @anthropic-ai/sdk. The point of the wrapper is the
// interface `AnthropicClient` — test seam. Pattern runner calls
// `messages.create()`, nothing else.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

export interface AnthropicAuthOptions {
  apiKey: string | null;
  authToken: string | null;
}

export function resolveAnthropicAuthOptions(env: NodeJS.ProcessEnv = process.env): AnthropicAuthOptions {
  const authMode = env.LLM_AUTH_MODE?.toLowerCase();
  const apiKey = env.ANTHROPIC_API_KEY ?? null;
  const authToken = env.ANTHROPIC_AUTH_TOKEN ?? readClaudeCodeAccessToken(env);

  if (authMode === "oauth") {
    if (apiKey) {
      throw new Error("ANTHROPIC_API_KEY must be unset when LLM_AUTH_MODE=oauth");
    }
    if (!authToken) {
      throw new Error(
        "ANTHROPIC_AUTH_TOKEN is required when LLM_AUTH_MODE=oauth, or CLAUDE_CONFIG_DIR must point to Claude Code credentials",
      );
    }
    return { apiKey: null, authToken };
  }

  return { apiKey, authToken };
}

export function readClaudeCodeAccessToken(env: NodeJS.ProcessEnv = process.env, now = Date.now()): string | null {
  const configDir = env.CLAUDE_CONFIG_DIR;
  if (!configDir) return null;

  try {
    const raw = readFileSync(join(configDir, ".credentials.json"), "utf8");
    const parsed = JSON.parse(raw) as { claudeAiOauth?: { accessToken?: unknown; expiresAt?: unknown } };
    const oauth = parsed.claudeAiOauth;
    if (typeof oauth?.accessToken !== "string" || oauth.accessToken.length === 0) return null;

    if (typeof oauth.expiresAt === "number" && oauth.expiresAt <= now + 5 * 60 * 1000) {
      throw new Error("Claude Code OAuth access token is expired or within the 5 minute refresh buffer");
    }

    return oauth.accessToken;
  } catch (error) {
    if (error instanceof Error && error.message.includes("refresh buffer")) throw error;
    return null;
  }
}

export interface MessagesCreateParams {
  model: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
  temperature?: number;
}

export interface MessagesCreateResult {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
  model: string;
}

export interface AnthropicClient {
  messagesCreate(params: MessagesCreateParams): Promise<MessagesCreateResult>;
}

export function createAnthropicClient(apiKey?: string): AnthropicClient {
  const auth = apiKey !== undefined ? { apiKey, authToken: null } : resolveAnthropicAuthOptions();
  const sdk = new Anthropic(auth);
  return {
    async messagesCreate(params) {
      const res = await sdk.messages.create({
        model: params.model,
        system: params.system,
        messages: params.messages,
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0,
      });
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return {
        text,
        usage: { input_tokens: res.usage.input_tokens, output_tokens: res.usage.output_tokens },
        model: res.model,
      };
    },
  };
}
