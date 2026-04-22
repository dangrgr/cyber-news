// Loads entities.yaml. Hand-maintained per CLAUDE.md invariants — never auto-update it.

import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";

export interface ActorEntry {
  canonical: string;
  aliases?: string[];
  attribution?: string;
  type?: string;
  members?: string[];
  notes?: string;
}

export interface CampaignEntry {
  canonical: string;
  actors?: string[];
  start_date?: string;
  status?: string;
  notes?: string;
}

export interface EntitiesFile {
  version: number;
  last_updated: string;
  actors: ActorEntry[];
  campaigns: CampaignEntry[];
  watched_orgs: { critical?: string[]; relevant_to_me?: string[] };
  watched_cves_proactive: string[];
  trusted_sources: {
    tier_1?: string[];
    tier_2?: string[];
    tier_3?: string[];
    vendor_authoritative?: string[];
  };
}

export interface AliasRow {
  alias: string;
  canonical: string;
  entity_type: "actor" | "campaign" | "org";
  confidence: number;
}

export async function loadEntities(path: string): Promise<EntitiesFile> {
  const raw = await readFile(path, "utf-8");
  return parseYaml(raw) as EntitiesFile;
}

/**
 * Flatten the YAML into the (alias → canonical, type, confidence) rows that
 * the `entity_aliases` table stores and the pre-filter substring-matches against.
 *
 * Watched orgs are emitted as type=org with their own name as alias (1:1).
 */
export function flattenAliases(file: EntitiesFile): AliasRow[] {
  const rows: AliasRow[] = [];
  const seen = new Set<string>();

  const push = (alias: string, canonical: string, type: AliasRow["entity_type"]) => {
    const key = `${type}|${alias.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ alias, canonical, entity_type: type, confidence: 1.0 });
  };

  for (const actor of file.actors ?? []) {
    push(actor.canonical, actor.canonical, "actor");
    for (const a of actor.aliases ?? []) push(a, actor.canonical, "actor");
  }
  for (const camp of file.campaigns ?? []) {
    push(camp.canonical, camp.canonical, "campaign");
  }
  for (const org of file.watched_orgs?.critical ?? []) push(org, org, "org");
  for (const org of file.watched_orgs?.relevant_to_me ?? []) push(org, org, "org");

  return rows;
}
