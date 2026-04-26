// CLI entry for `npm run investigate`. Reads INCIDENT_ID from env, wires
// real clients, delegates to the orchestrator, then posts to Discord and
// persists. Idempotent: if incidents.investigation_status='complete' we exit
// without running the agent.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

import { getClient } from "../turso/client.ts";
import { getIncident, setInvestigationStatus, queryByFilter } from "../turso/incidents.ts";
import { getArticlesByIncidentId } from "../turso/articles.ts";
import { insertInvestigation, setInvestigationComplete } from "../turso/investigations.ts";
import { createAnthropicClient } from "../clients/anthropic.ts";
import { createMessagesWithToolsClient } from "../clients/anthropic_tools.ts";
import { createNvdClient } from "../clients/nvd.ts";
import { loadEntities } from "../entities/load.ts";
import {
  postInvestigationStart,
  postInvestigationResult,
  postInvestigationFailed,
} from "../discord/investigation.ts";
import { buildToolRegistry } from "./tools.ts";
import { runInvestigation } from "./orchestrator.ts";
import type { InvestigationInput } from "./types.ts";

async function main(): Promise<void> {
  const incidentId = required("INCIDENT_ID");
  const webhook = required("DISCORD_WEBHOOK_INVESTIGATIONS");
  const model = process.env.MODEL_INVESTIGATION ?? "claude-sonnet-4-6";

  const db = getClient();
  const incident = await getIncident(db, incidentId);
  if (!incident) {
    fatalJson("incident_not_found", { incident_id: incidentId });
    return;
  }
  if (incident.investigation_status === "complete") {
    console.log(JSON.stringify({ investigate: "skipped", reason: "already_complete", incident_id: incidentId }));
    return;
  }

  const articles = await getArticlesByIncidentId(db, incidentId);
  const sourceZero = articles[0];
  if (!sourceZero) {
    fatalJson("no_articles_for_incident", { incident_id: incidentId });
    return;
  }

  const relatedIncidents = await findRelatedIncidents(db, incident);

  await setInvestigationStatus(db, incidentId, "pending");

  const investigationId = `invg-${randomUUID().slice(0, 8)}`;
  await insertInvestigation(db, investigationId, incidentId);

  const startResult = await postInvestigationStart(incident, { webhookUrl: webhook });

  try {
    const entities = await loadEntities("entities.yaml");
    const toolsDeps = {
      dbClient: db,
      cveCacheDeps: { client: db, nvd: createNvdClient() },
      entities,
      anthropic: createAnthropicClient(),
    };
    const input: InvestigationInput = {
      incident,
      sourceZero,
      relatedIncidents,
    };
    const result = await runInvestigation(input, {
      client: createMessagesWithToolsClient(),
      model,
      tools: buildToolRegistry(toolsDeps),
      limits: {
        maxCostUsd: numEnv("MAX_INVESTIGATION_COST_USD", 1.5),
        maxToolCalls: numEnv("MAX_INVESTIGATION_TOOL_CALLS", 40),
      },
    });

    await writeLogFile(incidentId, result.markdown);
    await setInvestigationComplete(db, investigationId, result);
    await setInvestigationStatus(db, incidentId, "complete");
    await postInvestigationResult(
      { threadId: startResult.threadId, incident, result },
      { webhookUrl: webhook },
    );

    console.log(
      JSON.stringify({
        investigate: "complete",
        incident_id: incidentId,
        investigation_id: investigationId,
        terminated: result.terminated_reason,
        cost_usd: result.cost_usd,
        tool_calls: result.tool_calls,
        sources: result.sources_fetched,
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setInvestigationStatus(db, incidentId, "none"); // allow retry
    await postInvestigationFailed(
      startResult.threadId,
      incident,
      message,
      { webhookUrl: webhook },
    ).catch(() => undefined);
    fatalJson("investigate_failed", { incident_id: incidentId, message });
  }
}

interface Related {
  id: string;
  title: string;
  incident_date: string | null;
  shared_actors: string[];
  shared_cves: string[];
}

async function findRelatedIncidents(
  db: ReturnType<typeof getClient>,
  incident: Awaited<ReturnType<typeof getIncident>>,
): Promise<Related[]> {
  if (!incident) return [];
  const out: Related[] = [];
  const seen = new Set<string>([incident.id]);

  const actors = incident.threat_actors_attributed;
  const cves = incident.cves;

  for (const actor of actors) {
    const rows = await queryByFilter(db, { actor, limit: 5 });
    for (const r of rows) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push({
        id: r.id,
        title: r.title,
        incident_date: r.incident_date,
        shared_actors: intersect(actors, r.threat_actors_attributed),
        shared_cves: intersect(cves, r.cves),
      });
      if (out.length >= 5) break;
    }
    if (out.length >= 5) break;
  }
  if (out.length < 5) {
    for (const cve of cves) {
      const rows = await queryByFilter(db, { cve, limit: 5 });
      for (const r of rows) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push({
          id: r.id,
          title: r.title,
          incident_date: r.incident_date,
          shared_actors: intersect(actors, r.threat_actors_attributed),
          shared_cves: intersect(cves, r.cves),
        });
        if (out.length >= 5) break;
      }
      if (out.length >= 5) break;
    }
  }
  return out;
}

function intersect(a: readonly string[], b: readonly string[]): string[] {
  const bs = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => bs.has(x.toLowerCase()));
}

async function writeLogFile(incidentId: string, markdown: string): Promise<void> {
  const path = join("logs", "investigations", `${incidentId}.md`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, markdown, "utf-8");
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    fatalJson("env_missing", { name });
    throw new Error(`unreachable`); // process.exit in fatalJson
  }
  return v;
}

function numEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fatalJson(error: string, extra: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ investigate: "fatal", error, ...extra }));
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(
      JSON.stringify({ investigate: "fatal", error: err instanceof Error ? err.message : String(err) }),
    );
    process.exit(1);
  });
}
