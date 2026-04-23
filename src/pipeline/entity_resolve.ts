// Entity alias → canonical resolution, plus unknown-entity logging.
// The entity_aliases table is a cache of the hand-maintained entities.yaml
// (CLAUDE.md: never auto-update it). When extraction mentions an entity we
// don't recognize, we append it to a sidecar JSONL for weekly human review —
// we never write it back to the table or the YAML.

import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Client } from "@libsql/client";

export interface ResolvedEntity {
  raw: string;
  canonical: string;
  known: boolean;
  entityType: "actor" | "org" | "campaign" | null;
}

export interface EntityResolverDeps {
  client: Client;
  /** Where to append unknown-entity records. Default: logs/unknown_entities/{YYYY-MM}.jsonl */
  unknownLogPath?: string;
  appendFile?: (path: string, content: string) => Promise<void>;
  now?: () => Date;
}

/**
 * Resolves a set of raw entity names against entity_aliases. Case-insensitive
 * lookup. Unknown entities are returned as `known: false, canonical: raw` and
 * appended to the unknown-entity log (one JSONL record per unknown, deduped
 * per call).
 */
export async function resolveEntities(
  entities: Array<{ raw: string; entityType: "actor" | "org" | "campaign" }>,
  deps: EntityResolverDeps,
): Promise<ResolvedEntity[]> {
  if (entities.length === 0) return [];

  const lowered = entities.map((e) => ({ ...e, aliasLower: e.raw.trim().toLowerCase() }));
  const aliases = await loadAliasesLower(deps.client);

  const resolved: ResolvedEntity[] = [];
  const unknownDedup = new Set<string>();
  const unknownRows: ResolvedEntity[] = [];

  for (const e of lowered) {
    const hit = aliases.get(e.aliasLower);
    if (hit && (hit.entityType === e.entityType || hit.entityType === null)) {
      resolved.push({ raw: e.raw, canonical: hit.canonical, known: true, entityType: e.entityType });
      continue;
    }
    const r: ResolvedEntity = { raw: e.raw, canonical: e.raw, known: false, entityType: e.entityType };
    resolved.push(r);
    const dedupKey = `${e.entityType}:${e.aliasLower}`;
    if (!unknownDedup.has(dedupKey)) {
      unknownDedup.add(dedupKey);
      unknownRows.push(r);
    }
  }

  if (unknownRows.length > 0) {
    await logUnknowns(unknownRows, deps);
  }
  return resolved;
}

async function loadAliasesLower(
  client: Client,
): Promise<Map<string, { canonical: string; entityType: string | null }>> {
  const res = await client.execute(`SELECT alias, canonical, entity_type FROM entity_aliases`);
  const m = new Map<string, { canonical: string; entityType: string | null }>();
  for (const row of res.rows) {
    m.set(String(row.alias).trim().toLowerCase(), {
      canonical: String(row.canonical),
      entityType: row.entity_type == null ? null : String(row.entity_type),
    });
  }
  return m;
}

async function logUnknowns(rows: ResolvedEntity[], deps: EntityResolverDeps): Promise<void> {
  const now = (deps.now ?? (() => new Date()))();
  const month = now.toISOString().slice(0, 7); // YYYY-MM
  const path = deps.unknownLogPath ?? `logs/unknown_entities/${month}.jsonl`;
  const writer = deps.appendFile ?? defaultAppend;
  const lines = rows
    .map((r) =>
      JSON.stringify({
        logged_at: now.toISOString(),
        raw: r.raw,
        entity_type: r.entityType,
      }),
    )
    .join("\n") + "\n";
  await writer(path, lines);
}

async function defaultAppend(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, content, "utf-8");
}
