// Generic pattern runner: load prompt + schema, call Anthropic, parse+validate
// JSON output, return a typed result. See PRD §10.
//
// Retry policy:
// - JSON parse failure: retry once with a "raw JSON only" nudge.
// - Schema validation failure: throw immediately. Drift should fail loudly,
//   not retry silently.

import { readFile as fsReadFile } from "node:fs/promises";

import type { AnthropicClient } from "../clients/anthropic.ts";
import { renderTemplate } from "./template.ts";
import { validate, type JsonSchema, type JsonValue } from "./validator.ts";

export interface PatternDefinition<TInput, TOutput> {
  name: "triage" | "extract" | "factcheck";
  promptPath: string;
  schemaPath: string;
  modelEnvVar: "MODEL_TRIAGE" | "MODEL_EXTRACTION" | "MODEL_FACTCHECK";
  buildPlaceholders: (input: TInput) => Record<string, string>;
}

export interface RunnerDeps {
  anthropic: AnthropicClient;
  readFile?: (path: string) => Promise<string>;
  env?: NodeJS.ProcessEnv;
  maxOutputTokens?: number;
}

export interface PatternRunResult<TOutput> {
  output: TOutput;
  usage: { input_tokens: number; output_tokens: number; model: string };
  retries: 0 | 1;
  raw: string;
}

export class PatternModelNotConfiguredError extends Error {
  constructor(envVar: string) {
    super(`Pattern model env var not set: ${envVar}`);
    this.name = "PatternModelNotConfiguredError";
  }
}

export class PatternMalformedJsonError extends Error {
  constructor(
    public readonly patternName: string,
    public readonly raw: string,
    public readonly parseError: string,
  ) {
    super(`Pattern '${patternName}' returned unparseable JSON after retry: ${parseError}`);
    this.name = "PatternMalformedJsonError";
  }
}

export class PatternSchemaError extends Error {
  constructor(
    public readonly patternName: string,
    public readonly raw: string,
    public readonly errors: ReadonlyArray<{ path: string; message: string }>,
  ) {
    super(
      `Pattern '${patternName}' output failed schema validation: ` +
        errors.map((e) => `${e.path} ${e.message}`).join("; "),
    );
    this.name = "PatternSchemaError";
  }
}

const promptCache = new Map<string, string>();
const schemaCache = new Map<string, JsonSchema>();

/** Clears prompt/schema file caches. Tests use this between fixtures. */
export function resetPatternCaches(): void {
  promptCache.clear();
  schemaCache.clear();
}

export async function runPattern<I, O>(
  def: PatternDefinition<I, O>,
  input: I,
  deps: RunnerDeps,
): Promise<PatternRunResult<O>> {
  const readFile = deps.readFile ?? ((p: string) => fsReadFile(p, "utf-8"));
  const env = deps.env ?? process.env;

  const model = env[def.modelEnvVar];
  if (!model) throw new PatternModelNotConfiguredError(def.modelEnvVar);

  const systemPrompt = await loadPrompt(def.promptPath, readFile);
  const schema = await loadSchema(def.schemaPath, readFile);

  const rendered = renderTemplate(systemPrompt, def.buildPlaceholders(input));

  const userNudge = "Respond with a single JSON object matching the schema. No prose, no code fences.";

  const firstResp = await deps.anthropic.messagesCreate({
    model,
    system: rendered,
    messages: [{ role: "user", content: userNudge }],
    maxTokens: deps.maxOutputTokens ?? 4096,
    temperature: 0,
  });

  const firstParsed = tryParseJson(firstResp.text);
  if (firstParsed.ok) {
    return finalize(def, schema, firstResp, firstParsed.value, 0);
  }

  const retryResp = await deps.anthropic.messagesCreate({
    model,
    system: rendered,
    messages: [
      { role: "user", content: userNudge },
      { role: "assistant", content: firstResp.text },
      {
        role: "user",
        content: "Your previous response was not valid JSON. Respond with raw JSON only, no code fences, no prose.",
      },
    ],
    maxTokens: deps.maxOutputTokens ?? 4096,
    temperature: 0,
  });

  const retryParsed = tryParseJson(retryResp.text);
  if (!retryParsed.ok) {
    throw new PatternMalformedJsonError(def.name, retryResp.text, retryParsed.error);
  }
  return finalize(def, schema, retryResp, retryParsed.value, 1);
}

function finalize<I, O>(
  def: PatternDefinition<I, O>,
  schema: JsonSchema,
  resp: { text: string; usage: { input_tokens: number; output_tokens: number }; model: string },
  value: JsonValue,
  retries: 0 | 1,
): PatternRunResult<O> {
  const errors = validate(schema, value);
  if (errors.length > 0) {
    throw new PatternSchemaError(def.name, resp.text, errors);
  }
  return {
    output: value as unknown as O,
    usage: { ...resp.usage, model: resp.model },
    retries,
    raw: resp.text,
  };
}

async function loadPrompt(path: string, readFile: (p: string) => Promise<string>): Promise<string> {
  const cached = promptCache.get(path);
  if (cached !== undefined) return cached;
  const content = await readFile(path);
  promptCache.set(path, content);
  return content;
}

async function loadSchema(path: string, readFile: (p: string) => Promise<string>): Promise<JsonSchema> {
  const cached = schemaCache.get(path);
  if (cached !== undefined) return cached;
  const raw = await readFile(path);
  const parsed = JSON.parse(raw) as JsonSchema;
  schemaCache.set(path, parsed);
  return parsed;
}

type ParseResult = { ok: true; value: JsonValue } | { ok: false; error: string };

function tryParseJson(text: string): ParseResult {
  const trimmed = stripFences(text.trim());
  try {
    return { ok: true, value: JSON.parse(trimmed) as JsonValue };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Strip Markdown fence if the model slipped one in. Conservative: only strips
 * when the whole text is a single fenced block.
 */
function stripFences(text: string): string {
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(text);
  return match ? match[1]! : text;
}
