// Tool-use-aware Anthropic client. Separate from the Phase 2 `AnthropicClient`
// (which exposes only `messagesCreate` returning a text blob) because the
// investigation agent needs to read structured `tool_use` blocks, append
// `tool_result` blocks back, and track multi-turn stop_reason transitions.
//
// The interface is deliberately the minimal subset of Anthropic's SDK that
// the orchestrator needs, so tests can inject a mock without touching the
// real SDK's wider surface.

import Anthropic from "@anthropic-ai/sdk";

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ResponseContentBlock = TextBlock | ToolUseBlock;
export type RequestContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface Message {
  role: "user" | "assistant";
  content: RequestContentBlock[] | string;
}

export type ToolDefinition =
  | {
      type?: "custom";
      name: string;
      description: string;
      input_schema: Record<string, unknown>;
    }
  | {
      type: "web_search_20250305";
      name: "web_search";
      max_uses?: number;
    };

export interface MessagesWithToolsParams {
  model: string;
  system: string;
  messages: Message[];
  tools: ToolDefinition[];
  max_tokens: number;
  temperature?: number;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export interface MessagesWithToolsResponse {
  content: ResponseContentBlock[];
  stop_reason: string;
  usage: Usage;
  model: string;
}

export interface MessagesWithToolsClient {
  create(params: MessagesWithToolsParams): Promise<MessagesWithToolsResponse>;
}

export function createMessagesWithToolsClient(apiKey?: string): MessagesWithToolsClient {
  const sdk = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
  return {
    async create(params) {
      const res = await sdk.messages.create({
        model: params.model,
        system: params.system,
        messages: params.messages as unknown as Anthropic.MessageParam[],
        tools: params.tools as unknown as Anthropic.ToolUnion[],
        max_tokens: params.max_tokens,
        temperature: params.temperature ?? 0,
      });
      const content: ResponseContentBlock[] = [];
      for (const block of res.content) {
        if (block.type === "text") {
          content.push({ type: "text", text: block.text });
        } else if (block.type === "tool_use") {
          content.push({
            type: "tool_use",
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
        // other block types (thinking, server_tool_use results) are ignored;
        // the model's textual summary captures what we need downstream.
      }
      return {
        content,
        stop_reason: res.stop_reason ?? "end_turn",
        usage: {
          input_tokens: res.usage.input_tokens,
          output_tokens: res.usage.output_tokens,
          cache_read_input_tokens: res.usage.cache_read_input_tokens ?? null,
          cache_creation_input_tokens: res.usage.cache_creation_input_tokens ?? null,
        },
        model: res.model,
      };
    },
  };
}
