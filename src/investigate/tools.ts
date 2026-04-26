// The investigation agent's custom-tool implementations. Each tool's `run`:
//   - validates its input (happens before call by the model's JSON Schema,
//     but we defend anyway)
//   - executes the action (DB query, HTTP fetch, NVD lookup, pattern call)
//   - returns a JSON-stringified result for the model to read
//
// Tools NEVER throw — they return `{error: "..."}` strings so the agent can
// reason about failure rather than crashing the orchestrator.

import type { Client } from "@libsql/client";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

import { lookupCve, type CveCacheDeps } from "../factcheck/cve_cache.ts";
import { queryByFilter } from "../turso/incidents.ts";
import { runPattern } from "../patterns/runner.ts";
import { VENDOR_DOC_REVIEW_PATTERN } from "../patterns/registry.ts";
import type { AnthropicClient } from "./../clients/anthropic.ts";
import type { ActorEntry, EntitiesFile } from "../entities/load.ts";
import { DEFAULT_ALLOWLIST, isAllowed } from "./allowlist.ts";
import type { ToolDefinition } from "../clients/anthropic_tools.ts";

export type ToolFn = (input: unknown) => Promise<string>;
export type ToolRegistry = Record<string, ToolFn>;

export interface ToolDeps {
  dbClient: Client;
  cveCacheDeps: CveCacheDeps;
  entities: EntitiesFile;
  anthropic: AnthropicClient;     // for vendor_doc_review sub-pattern
  fetchFn?: typeof globalThis.fetch;
  allowlist?: readonly string[];
  patternsRoot?: string;
}

export const WEB_SEARCH_TOOL: ToolDefinition = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 8,
};

export const FETCH_URL_TOOL: ToolDefinition = {
  type: "custom",
  name: "fetch_url",
  description:
    "Fetch a URL and return its readable text content. Only allowlisted domains (tier-1 reporting, vendor PSIRTs, gov advisories, NVD) are permitted. Returns {error:'domain_not_allowlisted'} for rejected hosts and {error:'http_<code>'} for non-200 responses. Text is truncated to 30000 characters.",
  input_schema: {
    type: "object",
    required: ["url"],
    properties: { url: { type: "string", description: "Absolute http(s) URL" } },
    additionalProperties: false,
  },
};

export const GET_CVE_TOOL: ToolDefinition = {
  type: "custom",
  name: "get_cve",
  description:
    "Look up a CVE in NVD (via the local read-through cache). Returns {exists, cvss_v31, severity, summary, kev_listed}. Returns {exists:false} if NVD has no record. Cache is 14 days.",
  input_schema: {
    type: "object",
    required: ["cve_id"],
    properties: { cve_id: { type: "string", description: "e.g. CVE-2026-12345" } },
    additionalProperties: false,
  },
};

export const QUERY_INCIDENTS_TOOL: ToolDefinition = {
  type: "custom",
  name: "query_incidents",
  description:
    "Search the local incidents database. Filters are AND-combined. Empty filter returns the 20 most recent incidents. Returns up to 20 rows with {id, title, incident_date, confidence, threat_actors_attributed, victim_orgs_confirmed, cves, summary}.",
  input_schema: {
    type: "object",
    properties: {
      actor: { type: "string" },
      victim: { type: "string" },
      cve: { type: "string" },
      since: { type: "string", description: "ISO date, inclusive" },
      until: { type: "string", description: "ISO date, inclusive" },
    },
    additionalProperties: false,
  },
};

export const GET_ACTOR_PROFILE_TOOL: ToolDefinition = {
  type: "custom",
  name: "get_actor_profile",
  description:
    "Look up an actor in the hand-maintained entity YAML. Returns canonical name, aliases, attribution, type, notes. Case-insensitive match against canonical or any alias. Returns {error:'not_found'} if the actor is unknown.",
  input_schema: {
    type: "object",
    required: ["name"],
    properties: { name: { type: "string" } },
    additionalProperties: false,
  },
};

export const REVIEW_VENDOR_ADVISORY_TOOL: ToolDefinition = {
  type: "custom",
  name: "review_vendor_advisory",
  description:
    "Fetch a vendor security advisory and extract structured data (CVSS, KEV, affected/fixed versions, exploitation status, mitigations). Use this instead of fetch_url when you know the URL is a vendor PSIRT advisory.",
  input_schema: {
    type: "object",
    required: ["url"],
    properties: {
      url: { type: "string" },
      vendor: { type: "string", description: "Optional vendor hint" },
    },
    additionalProperties: false,
  },
};

export const CUSTOM_TOOL_DEFINITIONS: ToolDefinition[] = [
  FETCH_URL_TOOL,
  GET_CVE_TOOL,
  QUERY_INCIDENTS_TOOL,
  GET_ACTOR_PROFILE_TOOL,
  REVIEW_VENDOR_ADVISORY_TOOL,
];

export const INVESTIGATION_TOOLS: ToolDefinition[] = [
  WEB_SEARCH_TOOL,
  ...CUSTOM_TOOL_DEFINITIONS,
];

export function buildToolRegistry(deps: ToolDeps): ToolRegistry {
  const fetchFn = deps.fetchFn ?? globalThis.fetch;
  const allowlist = deps.allowlist ?? DEFAULT_ALLOWLIST;

  return {
    fetch_url: async (input) => {
      const { url } = asObject(input);
      if (typeof url !== "string") return errJson("missing_url");
      if (!isAllowed(url, allowlist)) return errJson("domain_not_allowlisted", { url });
      try {
        const body = await fetchWithTimeout(fetchFn, url, 10_000);
        return JSON.stringify({ url, ...body });
      } catch (e) {
        return errJson("fetch_failed", { url, message: errMsg(e) });
      }
    },

    get_cve: async (input) => {
      const { cve_id } = asObject(input);
      if (typeof cve_id !== "string") return errJson("missing_cve_id");
      try {
        const row = await lookupCve(cve_id, deps.cveCacheDeps);
        return JSON.stringify({
          cve_id: row.cve_id,
          exists: row.exists,
          cvss_v31: row.cvss_v31,
          severity: row.severity,
          summary: row.summary,
          kev_listed: row.kev_listed,
        });
      } catch (e) {
        return errJson("cve_lookup_failed", { cve_id, message: errMsg(e) });
      }
    },

    query_incidents: async (input) => {
      const f = asObject(input);
      try {
        const rows = await queryByFilter(deps.dbClient, {
          actor: typeof f.actor === "string" ? f.actor : undefined,
          victim: typeof f.victim === "string" ? f.victim : undefined,
          cve: typeof f.cve === "string" ? f.cve : undefined,
          since: typeof f.since === "string" ? f.since : undefined,
          until: typeof f.until === "string" ? f.until : undefined,
          limit: 20,
        });
        return JSON.stringify(
          rows.map((r) => ({
            id: r.id,
            title: r.title,
            incident_date: r.incident_date,
            confidence: r.confidence,
            threat_actors_attributed: r.threat_actors_attributed,
            victim_orgs_confirmed: r.victim_orgs_confirmed,
            cves: r.cves,
            summary: r.summary,
          })),
        );
      } catch (e) {
        return errJson("query_failed", { message: errMsg(e) });
      }
    },

    get_actor_profile: async (input) => {
      const { name } = asObject(input);
      if (typeof name !== "string") return errJson("missing_name");
      const match = findActor(deps.entities.actors ?? [], name);
      if (!match) return errJson("not_found", { name });
      return JSON.stringify({
        canonical: match.canonical,
        aliases: match.aliases ?? [],
        attribution: match.attribution ?? null,
        type: match.type ?? null,
        members: match.members ?? [],
        notes: match.notes ?? null,
      });
    },

    review_vendor_advisory: async (input) => {
      const { url, vendor } = asObject(input);
      if (typeof url !== "string") return errJson("missing_url");
      if (!isAllowed(url, allowlist)) return errJson("domain_not_allowlisted", { url });
      try {
        const fetched = await fetchWithTimeout(fetchFn, url, 10_000);
        const result = await runPattern(
          VENDOR_DOC_REVIEW_PATTERN,
          {
            url,
            vendor: typeof vendor === "string" ? vendor : "",
            document_text: fetched.text,
          },
          { anthropic: deps.anthropic },
        );
        return JSON.stringify(result.output);
      } catch (e) {
        return errJson("vendor_doc_review_failed", { url, message: errMsg(e) });
      }
    },
  };
}

function findActor(actors: ActorEntry[], name: string): ActorEntry | null {
  const needle = name.trim().toLowerCase();
  for (const a of actors) {
    if (a.canonical.toLowerCase() === needle) return a;
    for (const alias of a.aliases ?? []) {
      if (alias.toLowerCase() === needle) return a;
    }
  }
  return null;
}

interface FetchedBody {
  status: number;
  title: string | null;
  text: string;
  truncated: boolean;
}

async function fetchWithTimeout(
  fetchFn: typeof globalThis.fetch,
  url: string,
  timeoutMs: number,
): Promise<FetchedBody> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "cyber-news-investigator/1.0 (+https://github.com/dan/cyber-news)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
      },
    });
    if (!res.ok) {
      return { status: res.status, title: null, text: `HTTP ${res.status} ${res.statusText}`, truncated: false };
    }
    const raw = await res.text();
    const { title, text } = extractReadable(raw, url);
    const capped = text.slice(0, 30_000);
    return { status: res.status, title, text: capped, truncated: capped.length < text.length };
  } finally {
    clearTimeout(timer);
  }
}

function extractReadable(raw: string, url: string): { title: string | null; text: string } {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("<")) {
    // Non-HTML (JSON, plaintext, RSS) — return as-is.
    return { title: null, text: raw };
  }
  try {
    const dom = new JSDOM(raw, { url });
    const reader = new Readability(dom.window.document);
    const parsed = reader.parse();
    if (!parsed?.textContent) return { title: null, text: raw };
    return { title: parsed.title ?? null, text: parsed.textContent };
  } catch {
    return { title: null, text: raw };
  }
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function errJson(code: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ error: code, ...extra });
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
