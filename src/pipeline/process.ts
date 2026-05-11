// Phase 2 orchestrator: consume `stage_reached='deduped'` articles through
// triage → extract (chunked) → factcheck (deterministic + LLM + reconcile) →
// publish to Discord. Each article is processed sequentially; at GH Actions
// volume (~30 articles per 30-min run), parallelism isn't worth the
// complexity budget.
//
// Per the plan, this module is the composition layer — all real work is
// delegated to the modules committed earlier. Keeping this shallow makes
// the end-to-end test easy to mock and easy to read.

import { createHash } from "node:crypto";
import type { Client } from "@libsql/client";

import type { AnthropicClient } from "../clients/anthropic.ts";
import { type BraveClient, countByTier } from "../clients/brave.ts";
import type { DiscordClient } from "../clients/discord.ts";

import { loadEntities, flattenAliases } from "../entities/load.ts";

import {
  runPattern,
  type PatternRunResult,
  PatternMalformedJsonError,
  PatternSchemaError,
} from "../patterns/runner.ts";
import { TRIAGE_PATTERN, EXTRACT_PATTERN, FACTCHECK_PATTERN } from "../patterns/registry.ts";
import type {
  ExtractionOutput,
  FactcheckOutput,
  TriageOutput,
} from "../patterns/types.ts";

import { chunkArticle } from "./chunk.ts";
import { mergeExtractions } from "./merge_extraction.ts";
import { resolveEntities } from "./entity_resolve.ts";
import {
  failureCodeFromError,
  mapDeterministicKind,
  mapReconcileReason,
  mapTriageReason,
  type FailureCode,
} from "./failure_codes.ts";

import { runDeterministic } from "../factcheck/deterministic.ts";
import { cveExists, type CveCacheDeps } from "../factcheck/cve_cache.ts";
import { reconcile } from "../factcheck/reconcile.ts";

import { composeEmbed } from "../discord/embed.ts";
import { publishIncident } from "../discord/publish.ts";

import {
  queryByStage,
  setStage,
  attachIncident,
  loadAliasesIntoTable,
  type ArticleRow,
} from "../turso/articles.ts";
import { insertIncident, getIncident, addSourceToIncident } from "../turso/incidents.ts";

import { getSourceByCanonicalUrl } from "../ingest/sources.ts";
import type { RunLogger } from "../util/run_log.ts";

export interface ProcessDeps {
  db: Client;
  anthropic: AnthropicClient;
  discord: DiscordClient;
  brave: BraveClient;
  cveCache: CveCacheDeps;
  /** Env vars. Defaults to process.env. Test seam. */
  env?: NodeJS.ProcessEnv;
  /** Max articles per run. Defaults to MAX_PROCESS_BATCH env, then 50. */
  maxBatch?: number;
  /** Path to entities.yaml. Defaults to "entities.yaml". */
  entitiesPath?: string;
  /** Injectable clock for tests. */
  now?: () => Date;
  /** Optional run logger; threaded into runPattern so model calls show up
   *  as `model_call` events in the per-run NDJSON. */
  runLog?: RunLogger;
}

export interface StageCosts {
  calls: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface ProcessSummary {
  processed: number;
  triage_rejected: number;
  extracted: number;
  factcheck_failed: number;
  published: number;
  /** Backward-compat: equals `costs.total.calls`. Kept one release for any
   *  agent dashboards still consuming the flat field. */
  // TODO: remove after agent dashboards consume costs.total.calls
  model_calls: number;
  costs: { triage: StageCosts; extract: StageCosts; factcheck: StageCosts; total: StageCosts };
}

function emptyStageCosts(): StageCosts {
  return { calls: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0 };
}

function accumulate(bucket: StageCosts, r: PatternRunResult<unknown>): void {
  bucket.calls += 1;
  bucket.input_tokens += r.usage.input_tokens;
  bucket.output_tokens += r.usage.output_tokens;
  bucket.cost_usd += r.cost_usd;
}

function addStage(into: StageCosts, from: StageCosts): void {
  into.calls += from.calls;
  into.input_tokens += from.input_tokens;
  into.output_tokens += from.output_tokens;
  into.cost_usd += from.cost_usd;
}

interface StageMetric {
  cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
}

type TerminalState = "published" | "triage_rejected" | "factcheck_failed" | "error";

export async function processPendingArticles(deps: ProcessDeps): Promise<ProcessSummary> {
  const env = deps.env ?? process.env;
  // Note `|| 50` not `?? 50`: an empty-string env var (common when a GH Actions
  // repo variable is not set) parses via Number() to 0, which would silently
  // produce queryByStage(..., 0). `||` treats 0/empty-string as the "unset"
  // case and falls back to the sane default.
  const maxBatch = deps.maxBatch ?? (Number(env.MAX_PROCESS_BATCH) || 50);

  // Warm the entity_aliases table from the YAML once per run (cheap, idempotent).
  const entities = await loadEntities(deps.entitiesPath ?? "entities.yaml");
  await loadAliasesIntoTable(deps.db, flattenAliases(entities));

  const pending = await queryByStage(deps.db, "deduped", maxBatch);
  const summary: ProcessSummary = {
    processed: 0,
    triage_rejected: 0,
    extracted: 0,
    factcheck_failed: 0,
    published: 0,
    model_calls: 0,
    costs: {
      triage: emptyStageCosts(),
      extract: emptyStageCosts(),
      factcheck: emptyStageCosts(),
      total: emptyStageCosts(),
    },
  };

  for (const article of pending) {
    summary.processed++;
    const articleStart = Date.now();
    const stages: { triage?: StageMetric; extract?: StageMetric; factcheck?: StageMetric } = {};
    let terminal: TerminalState = "error";
    let failure_code: FailureCode | undefined;
    let failure_codes: FailureCode[] | undefined;
    let failure_reason: string | undefined;
    try {
      const result = await processOne(article, deps, env, entities, stages);
      addStage(summary.costs.triage, result.stageCosts.triage);
      addStage(summary.costs.extract, result.stageCosts.extract);
      addStage(summary.costs.factcheck, result.stageCosts.factcheck);
      failure_code = result.failure_code;
      failure_codes = result.failure_codes;
      failure_reason = result.failure_reason;
      switch (result.kind) {
        case "triage_rejected":
          summary.triage_rejected++;
          terminal = "triage_rejected";
          break;
        case "factcheck_failed":
          summary.factcheck_failed++;
          terminal = "factcheck_failed";
          break;
        case "published":
          summary.published++;
          terminal = "published";
          break;
      }
    } catch (err) {
      // Unhandled error: stamp article with a distinctive failure so we can
      // postmortem from the DB without parsing stack traces.
      const msg = err instanceof Error ? err.message : String(err);
      await setStage(deps.db, article.id, "factcheck_failed", `unhandled:${msg.slice(0, 200)}`);
      summary.factcheck_failed++;
      terminal = "error";
      failure_code = failureCodeFromError(err);
      failure_reason = msg;
      // Pattern errors carry the raw model output on the error object;
      // surface it on the failure event so the agent can grep for it
      // without parsing stack traces from earlier model_call lines.
      const raw_model_output =
        err instanceof PatternMalformedJsonError || err instanceof PatternSchemaError
          ? err.raw
          : undefined;
      deps.runLog?.logEvent({
        event: "article_error",
        article_id: article.id,
        article_url: article.url,
        source_id: article.source_id,
        failure_code,
        failure_reason: msg,
        ...(raw_model_output !== undefined ? { raw_model_output } : {}),
      });
    }
    deps.runLog?.logEvent({
      event: "article_done",
      article_id: article.id,
      article_url: article.url,
      source_id: article.source_id,
      terminal_state: terminal,
      duration_ms: Date.now() - articleStart,
      stages,
      ...(failure_code !== undefined ? { failure_code } : {}),
      ...(failure_codes !== undefined ? { failure_codes } : {}),
      ...(failure_reason !== undefined ? { failure_reason } : {}),
    });
  }

  // total = sum of stages. Computed at the end so callers see a consistent view.
  addStage(summary.costs.total, summary.costs.triage);
  addStage(summary.costs.total, summary.costs.extract);
  addStage(summary.costs.total, summary.costs.factcheck);
  summary.model_calls = summary.costs.total.calls;

  return summary;
}

interface ProcessOneResult {
  kind: "triage_rejected" | "factcheck_failed" | "published";
  stageCosts: { triage: StageCosts; extract: StageCosts; factcheck: StageCosts };
  /** Primary failure code (first kind, for deterministic multi-kind cases).
   *  Undefined on the published path. */
  failure_code?: FailureCode;
  /** All failure codes for the deterministic gate (which can flag several
   *  kinds at once). Undefined on single-code paths. */
  failure_codes?: FailureCode[];
  /** Free-form reason string preserved for grep-ability. Mirrors what
   *  goes into `articles.failure_reason`. Undefined on the published path. */
  failure_reason?: string;
}

async function processOne(
  article: ArticleRow,
  deps: ProcessDeps,
  env: NodeJS.ProcessEnv,
  entities: Awaited<ReturnType<typeof loadEntities>>,
  stageMetrics: { triage?: StageMetric; extract?: StageMetric; factcheck?: StageMetric },
): Promise<ProcessOneResult> {
  const stageCosts = {
    triage: emptyStageCosts(),
    extract: emptyStageCosts(),
    factcheck: emptyStageCosts(),
  };
  // ProcessSummary.costs (StageCosts) doesn't carry duration; extract may run
  // many calls (one per chunk, possibly twice via reconcile), so track its
  // total duration locally to populate stageMetrics.extract.duration_ms.
  let extractDurationMs = 0;
  const anthropicDeps = { anthropic: deps.anthropic, env, runLog: deps.runLog };

  // ---- Triage ----
  const triage = await runPattern<typeof TRIAGE_PATTERN extends typeof TRIAGE_PATTERN ? Parameters<typeof TRIAGE_PATTERN.buildPlaceholders>[0] : never, TriageOutput>(
    TRIAGE_PATTERN,
    {
      title: article.title,
      url: article.url,
      source: article.source_id,
      published_at: article.published_at,
      body_1500: article.raw_text.slice(0, 1500),
      nearest_incident_json_or_null: "null", // TODO: match to nearest incident by title similarity (Phase 2.1)
    },
    anthropicDeps,
  );
  accumulate(stageCosts.triage, triage);
  stageMetrics.triage = {
    cost_usd: triage.cost_usd,
    input_tokens: triage.usage.input_tokens,
    output_tokens: triage.usage.output_tokens,
    duration_ms: triage.duration_ms,
  };

  if (triage.output.decision === "skip") {
    const failure_reason = triage.output.reason.slice(0, 200);
    const failure_code = mapTriageReason(triage.output.reason);
    await setStage(deps.db, article.id, "triage_rejected", failure_reason);
    deps.runLog?.logEvent({
      event: "triage_rejected",
      article_id: article.id,
      failure_code,
      failure_reason,
    });
    return { kind: "triage_rejected", stageCosts, failure_code, failure_reason };
  }

  // ---- Extract (chunk + merge) ----
  // Reconcile re-runs must go through the exact same path (chunk + merge) or
  // the chunk-0-preferred summary from the original run won't match the
  // single-pass summary from the re-run, producing spurious disagreements.
  const runExtract = async (): Promise<ExtractionOutput> => {
    const { chunks } = chunkArticle(article.raw_text);
    const perChunk: ExtractionOutput[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const r = await runPattern(
        EXTRACT_PATTERN,
        {
          url: article.url,
          source: article.source_id,
          published_at: article.published_at,
          chunk_index: String(i),
          total_chunks: String(chunks.length),
          raw_text: chunks[i]!,
        },
        anthropicDeps,
      );
      accumulate(stageCosts.extract, r);
      extractDurationMs += r.duration_ms;
      perChunk.push(r.output as ExtractionOutput);
    }
    const merged = mergeExtractions(perChunk);
    if (!merged.title) merged.title = article.title;
    return merged;
  };
  const extraction = await runExtract();
  stageMetrics.extract = {
    cost_usd: stageCosts.extract.cost_usd,
    input_tokens: stageCosts.extract.input_tokens,
    output_tokens: stageCosts.extract.output_tokens,
    duration_ms: extractDurationMs,
  };

  // ---- Factcheck: deterministic gate ----
  const det = await runDeterministic({
    extraction,
    rawText: article.raw_text,
    publishedAt: article.published_at,
    cveExists: (cveId) => cveExists(cveId, deps.cveCache),
  });
  if (!det.pass) {
    const reason = `deterministic:${det.failures.map((f) => f.kind).join(",")}`;
    const failure_reason = reason.slice(0, 200);
    // Map directly off `det.failures[].kind` (typed union) before the reason
    // string is composed — avoids re-parsing the joined string.
    const codes = det.failures.map((f) => mapDeterministicKind(f.kind));
    // Dedup while preserving order: the first kind is the "primary" code
    // for `article_done`; the full list goes on the dedicated event.
    const failure_codes = Array.from(new Set(codes));
    const failure_code = failure_codes[0]!;
    await setStage(deps.db, article.id, "factcheck_failed", failure_reason);
    deps.runLog?.logEvent({
      event: "factcheck_failed",
      article_id: article.id,
      stage_reached: "factcheck_deterministic",
      failure_code,
      failure_codes,
      failure_reason,
    });
    return { kind: "factcheck_failed", stageCosts, failure_code, failure_codes, failure_reason };
  }

  // ---- Factcheck: LLM + reconcile ----
  const fc = await runPattern(
    FACTCHECK_PATTERN,
    { raw_text: article.raw_text, extraction_json: JSON.stringify(extraction) },
    anthropicDeps,
  );
  accumulate(stageCosts.factcheck, fc);

  const decision = await reconcile({
    extraction1: extraction,
    factcheck1: fc.output as FactcheckOutput,
    reRunExtract: runExtract,
  });

  // Reconcile may have triggered another runExtract pass; stageCosts.extract is
  // already updated via accumulate(). Snapshot the final stageMetrics values.
  stageMetrics.extract = {
    cost_usd: stageCosts.extract.cost_usd,
    input_tokens: stageCosts.extract.input_tokens,
    output_tokens: stageCosts.extract.output_tokens,
    duration_ms: extractDurationMs,
  };
  stageMetrics.factcheck = {
    cost_usd: fc.cost_usd,
    input_tokens: fc.usage.input_tokens,
    output_tokens: fc.usage.output_tokens,
    duration_ms: fc.duration_ms,
  };

  if (decision.kind === "fail") {
    const failure_reason = decision.failureReason.slice(0, 200);
    const failure_code = mapReconcileReason(decision.failureReason);
    await setStage(deps.db, article.id, "factcheck_failed", failure_reason);
    deps.runLog?.logEvent({
      event: "factcheck_failed",
      article_id: article.id,
      stage_reached: "factcheck_reconcile",
      failure_code,
      failure_reason,
      raw_model_output: fc.raw,
    });
    return { kind: "factcheck_failed", stageCosts, failure_code, failure_reason };
  }

  const finalExtraction = decision.extraction;

  // ---- Entity resolve (side-effect: log unknowns, never auto-insert) ----
  await resolveEntities(
    [
      ...finalExtraction.victim_orgs_confirmed.map((raw) => ({ raw, entityType: "org" as const })),
      ...finalExtraction.threat_actors_attributed.map((raw) => ({ raw, entityType: "actor" as const })),
    ],
    { client: deps.db },
  );

  // ---- Incident: new or existing ----
  const incidentId = await resolveIncidentId(article, finalExtraction, deps);
  await attachIncident(deps.db, article.id, incidentId);
  await setStage(deps.db, article.id, "published");

  // ---- Publish ----
  const incident = await getIncident(deps.db, incidentId);
  if (!incident) throw new Error(`incident vanished: ${incidentId}`);

  const braveQuery = buildCorroborationQuery(finalExtraction);
  const braveResults = braveQuery ? await deps.brave.search(braveQuery) : [];
  const corroboration = countByTier(
    braveResults,
    entities.trusted_sources?.tier_1 ?? [],
    entities.trusted_sources?.tier_2 ?? [],
  );

  const embedSources = incident.source_urls.map((url) => ({
    name: getSourceByCanonicalUrl(url)?.name ?? new URL(url).hostname,
    url,
  }));

  await publishIncident(
    { incident, sources: embedSources, corroboration },
    { dbClient: deps.db, discord: deps.discord },
  );

  return { kind: "published", stageCosts };
}

async function resolveIncidentId(
  article: ArticleRow,
  extraction: ExtractionOutput,
  deps: ProcessDeps,
): Promise<string> {
  // If ingest already attached this article to an existing incident (fuzzy
  // title match at dedup time), reuse it and bump corroboration.
  if (article.incident_id) {
    await addSourceToIncident(deps.db, article.incident_id, article.url);
    return article.incident_id;
  }

  const newId = incidentIdFor(article, extraction);
  await insertIncident(deps.db, {
    id: newId,
    title: extraction.title || article.title,
    summary: extraction.summary,
    incidentDate: extraction.incident_date,
    confidence: extraction.confidence,
    victimOrgsConfirmed: extraction.victim_orgs_confirmed,
    orgsMentioned: extraction.orgs_mentioned,
    threatActorsAttributed: extraction.threat_actors_attributed,
    actorsMentioned: extraction.actors_mentioned,
    cves: extraction.cves,
    initialAccessVector: extraction.initial_access_vector,
    ttps: extraction.ttps,
    impactJson: JSON.stringify(extraction.impact),
    claimMarkersObserved: extraction.claim_markers_observed,
    primarySource: extraction.primary_source,
    sourceUrls: [article.url],
  });
  return newId;
}

/** Deterministic id so two processors hitting the same article produce the same incident id. */
function incidentIdFor(article: ArticleRow, extraction: ExtractionOutput): string {
  const key = [
    extraction.incident_date ?? article.published_at.slice(0, 10),
    (extraction.victim_orgs_confirmed[0] ?? article.title).toLowerCase().trim(),
    (extraction.threat_actors_attributed[0] ?? "").toLowerCase().trim(),
  ].join("|");
  return "inc-" + createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function buildCorroborationQuery(e: ExtractionOutput): string | null {
  const victim = e.victim_orgs_confirmed[0];
  const actor = e.threat_actors_attributed[0];
  if (!victim && !actor) return null;
  const parts: string[] = [];
  if (victim) parts.push(`"${victim}"`);
  if (actor) parts.push(`"${actor}"`);
  return parts.join(" ") + " breach OR hack OR compromise";
}
