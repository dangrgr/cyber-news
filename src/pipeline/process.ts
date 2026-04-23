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

import { runPattern } from "../patterns/runner.ts";
import { TRIAGE_PATTERN, EXTRACT_PATTERN, FACTCHECK_PATTERN } from "../patterns/registry.ts";
import type {
  ExtractionOutput,
  FactcheckOutput,
  TriageOutput,
} from "../patterns/types.ts";

import { chunkArticle } from "./chunk.ts";
import { mergeExtractions } from "./merge_extraction.ts";
import { resolveEntities } from "./entity_resolve.ts";

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
}

export interface ProcessSummary {
  processed: number;
  triage_rejected: number;
  extracted: number;
  factcheck_failed: number;
  published: number;
  model_calls: number;
}

export async function processPendingArticles(deps: ProcessDeps): Promise<ProcessSummary> {
  const env = deps.env ?? process.env;
  const maxBatch = deps.maxBatch ?? Number(env.MAX_PROCESS_BATCH ?? 50);

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
  };

  for (const article of pending) {
    summary.processed++;
    try {
      const result = await processOne(article, deps, env, entities);
      summary.model_calls += result.modelCalls;
      switch (result.kind) {
        case "triage_rejected":
          summary.triage_rejected++;
          break;
        case "factcheck_failed":
          summary.factcheck_failed++;
          break;
        case "published":
          summary.published++;
          break;
      }
    } catch (err) {
      // Unhandled error: stamp article with a distinctive failure so we can
      // postmortem from the DB without parsing stack traces.
      const msg = err instanceof Error ? err.message : String(err);
      await setStage(deps.db, article.id, "factcheck_failed", `unhandled:${msg.slice(0, 200)}`);
      summary.factcheck_failed++;
    }
  }

  return summary;
}

interface ProcessOneResult {
  kind: "triage_rejected" | "factcheck_failed" | "published";
  modelCalls: number;
}

async function processOne(
  article: ArticleRow,
  deps: ProcessDeps,
  env: NodeJS.ProcessEnv,
  entities: Awaited<ReturnType<typeof loadEntities>>,
): Promise<ProcessOneResult> {
  let modelCalls = 0;
  const anthropicDeps = { anthropic: deps.anthropic, env };

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
  modelCalls += 1;

  if (triage.output.decision === "skip") {
    await setStage(deps.db, article.id, "triage_rejected", triage.output.reason.slice(0, 200));
    return { kind: "triage_rejected", modelCalls };
  }

  // ---- Extract (chunk + merge) ----
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
    modelCalls += 1;
    perChunk.push(r.output as ExtractionOutput);
  }
  const extraction = mergeExtractions(perChunk);

  // ---- Factcheck: deterministic gate ----
  const det = await runDeterministic({
    extraction,
    rawText: article.raw_text,
    publishedAt: article.published_at,
    cveExists: (cveId) => cveExists(cveId, deps.cveCache),
  });
  if (!det.pass) {
    const reason = `deterministic:${det.failures.map((f) => f.kind).join(",")}`;
    await setStage(deps.db, article.id, "factcheck_failed", reason.slice(0, 200));
    return { kind: "factcheck_failed", modelCalls };
  }

  // ---- Factcheck: LLM + reconcile ----
  const fc = await runPattern(
    FACTCHECK_PATTERN,
    { raw_text: article.raw_text, extraction_json: JSON.stringify(extraction) },
    anthropicDeps,
  );
  modelCalls += 1;

  const decision = await reconcile({
    extraction1: extraction,
    factcheck1: fc.output as FactcheckOutput,
    reRunExtract: async () => {
      const r = await runPattern(
        EXTRACT_PATTERN,
        {
          url: article.url,
          source: article.source_id,
          published_at: article.published_at,
          chunk_index: "0",
          total_chunks: "1",
          raw_text: article.raw_text,
        },
        anthropicDeps,
      );
      modelCalls += 1;
      return r.output as ExtractionOutput;
    },
  });

  if (decision.kind === "fail") {
    await setStage(deps.db, article.id, "factcheck_failed", decision.failureReason.slice(0, 200));
    return { kind: "factcheck_failed", modelCalls };
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

  return { kind: "published", modelCalls };
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
