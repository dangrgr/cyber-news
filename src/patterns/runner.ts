// Generic pattern runner: load prompt + schema, call Anthropic, parse+validate
// JSON output, return a typed result. See PRD §10.
//
// Retry policy:
// - JSON parse failure: retry once with a "raw JSON only" nudge.
// - Schema validation failure: throw immediately. Drift should fail loudly,
//   not retry silently.

import { readFile as fsReadFile } from "node:fs/promises";
import { createHash } from "node:crypto";

import type { AnthropicClient } from "../clients/anthropic.ts";
import { renderTemplate } from "./template.ts";
import { validate, type JsonSchema, type JsonValue } from "./validator.ts";
import { computeCost, ratesForModel } from "../util/cost.ts";
import type { RunLogger } from "../util/run_log.ts";

export interface PatternDefinition<TInput, TOutput> {
  name: "triage" | "extract" | "factcheck" | "vendor_doc_review";
  promptPath: string;
  schemaPath: string;
  modelEnvVar:
    | "MODEL_TRIAGE"
    | "MODEL_EXTRACTION"
    | "MODEL_FACTCHECK"
    | "MODEL_VENDOR_DOC_REVIEW";
  buildPlaceholders: (input: TInput) => Record<string, string>;
}

export interface RunnerDeps {
  anthropic: AnthropicClient;
  readFile?: (path: string) => Promise<string>;
  env?: NodeJS.ProcessEnv;
  maxOutputTokens?: number;
  /** Optional run logger. When provided, every `messages.create` call is
   *  emitted as a `model_call` event. Non-breaking: existing call sites
   *  without a logger continue to work. */
  runLog?: RunLogger;
}

export interface PatternRunResult<TOutput> {
  output: TOutput;
  /** Token usage. `input_tokens` and `output_tokens` are summed across the
   *  initial call and the retry call (when one occurred), so they reflect
   *  what we actually paid for. `model` is the final response's model id. */
  usage: { input_tokens: number; output_tokens: number; model: string };
  /** USD cost summed across the initial call and the retry call. Computed
   *  from `usage` via `ratesForModel`. */
  cost_usd: number;
  /** Wall-clock ms summed across the initial call and the retry call. */
  duration_ms: number;
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

  const firstMessages = [{ role: "user" as const, content: userNudge }];
  const t0 = Date.now();
  const firstResp = await deps.anthropic.messagesCreate({
    model,
    system: rendered,
    messages: firstMessages,
    maxTokens: deps.maxOutputTokens ?? 4096,
    temperature: 0,
  });
  const firstDuration = Date.now() - t0;
  const firstCost = computeCost(
    firstResp.usage.input_tokens,
    firstResp.usage.output_tokens,
    ratesForModel(firstResp.model),
  );
  logModelCall(deps.runLog, firstResp, rendered, firstMessages, firstDuration);

  const firstParsed = tryParseJson(firstResp.text);
  if (firstParsed.ok) {
    return finalize(def, schema, firstResp, firstParsed.value, 0, {
      input_tokens: firstResp.usage.input_tokens,
      output_tokens: firstResp.usage.output_tokens,
      cost_usd: firstCost,
      duration_ms: firstDuration,
    });
  }

  const retryMessages = [
    { role: "user" as const, content: userNudge },
    { role: "assistant" as const, content: firstResp.text },
    {
      role: "user" as const,
      content: "Your previous response was not valid JSON. Respond with raw JSON only, no code fences, no prose.",
    },
  ];
  const t1 = Date.now();
  const retryResp = await deps.anthropic.messagesCreate({
    model,
    system: rendered,
    messages: retryMessages,
    maxTokens: deps.maxOutputTokens ?? 4096,
    temperature: 0,
  });
  const retryDuration = Date.now() - t1;
  const retryCost = computeCost(
    retryResp.usage.input_tokens,
    retryResp.usage.output_tokens,
    ratesForModel(retryResp.model),
  );
  logModelCall(deps.runLog, retryResp, rendered, retryMessages, retryDuration);

  const retryParsed = tryParseJson(retryResp.text);
  if (!retryParsed.ok) {
    throw new PatternMalformedJsonError(def.name, retryResp.text, retryParsed.error);
  }
  return finalize(def, schema, retryResp, retryParsed.value, 1, {
    input_tokens: firstResp.usage.input_tokens + retryResp.usage.input_tokens,
    output_tokens: firstResp.usage.output_tokens + retryResp.usage.output_tokens,
    cost_usd: firstCost + retryCost,
    duration_ms: firstDuration + retryDuration,
  });
}

interface CallTotals {
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  duration_ms: number;
}

function logModelCall(
  runLog: RunLogger | undefined,
  resp: { text: string; usage: { input_tokens: number; output_tokens: number }; model: string },
  system: string,
  messages: ReadonlyArray<{ role: string; content: string }>,
  duration_ms: number,
): void {
  if (!runLog) return;
  const rates = ratesForModel(resp.model);
  // SHA-256 of canonical JSON, first 16 hex chars: enough entropy for
  // intra-run correlation without depending on external libs.
  const digest = createHash("sha256")
    .update(JSON.stringify({ system, messages }))
    .digest("hex")
    .slice(0, 16);
  runLog.logCall({
    model: resp.model,
    input_tokens: resp.usage.input_tokens,
    output_tokens: resp.usage.output_tokens,
    cost_usd: computeCost(resp.usage.input_tokens, resp.usage.output_tokens, rates),
    duration_ms,
    payload_digest: digest,
    raw_output: resp.text,
  });
}

function finalize<I, O>(
  def: PatternDefinition<I, O>,
  schema: JsonSchema,
  resp: { text: string; usage: { input_tokens: number; output_tokens: number }; model: string },
  value: JsonValue,
  retries: 0 | 1,
  totals: CallTotals,
): PatternRunResult<O> {
  const errors = validate(schema, value);
  if (errors.length > 0) {
    throw new PatternSchemaError(def.name, resp.text, errors);
  }
  return {
    output: value as unknown as O,
    usage: {
      input_tokens: totals.input_tokens,
      output_tokens: totals.output_tokens,
      model: resp.model,
    },
    cost_usd: totals.cost_usd,
    duration_ms: totals.duration_ms,
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
