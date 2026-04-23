// Thin wrapper over @anthropic-ai/sdk. The point of the wrapper is the
// interface `AnthropicClient` — test seam. Pattern runner calls
// `messages.create()`, nothing else.

import Anthropic from "@anthropic-ai/sdk";

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
  const sdk = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
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
