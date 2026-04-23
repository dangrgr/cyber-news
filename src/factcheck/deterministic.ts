// The four deterministic factcheck checks from PRD §8.6. All pure — the only
// side effect is the CVE-existence lookup, which is passed in as a function
// so tests can mock it without any NVD or Turso dependency.

import { titleRatio } from "../util/similarity.ts";
import type { Confidence, ExtractionOutput } from "../patterns/types.ts";

export type DeterministicFailure =
  | { kind: "invalid_cve"; cve: string }
  | { kind: "date_out_of_window"; incidentDate: string; publishedAt: string }
  | { kind: "entity_not_in_article"; entity: string; entityClass: "victim" | "actor" | "cve" }
  | { kind: "claim_language_overreach"; marker: string; confidence: Confidence };

export interface DeterministicResult {
  pass: boolean;
  failures: DeterministicFailure[];
}

export interface DeterministicInputs {
  extraction: ExtractionOutput;
  rawText: string;
  publishedAt: string; // ISO 8601
  /** CVE existence check: returns true if NVD knows this CVE id. */
  cveExists: (cveId: string) => Promise<boolean>;
  /** Similarity threshold (0-100) for entity-in-article. PRD §8.6 calls for 85. */
  entityRatioThreshold?: number;
  /** +/- days window around publishedAt for incident_date sanity. PRD: -90/+7. */
  datePastDays?: number;
  dateFutureDays?: number;
}

const CLAIM_MARKERS: readonly string[] = [
  "claims",
  "alleges",
  "allegedly",
  "reportedly",
  "unverified",
  "said to",
  "according to",
  "attributed to",
];

export async function runDeterministic(input: DeterministicInputs): Promise<DeterministicResult> {
  const failures: DeterministicFailure[] = [];
  failures.push(...(await checkCves(input)));
  failures.push(...checkDateWindow(input));
  failures.push(...checkEntitiesInArticle(input));
  failures.push(...checkClaimLanguageAlignment(input));
  return { pass: failures.length === 0, failures };
}

async function checkCves(input: DeterministicInputs): Promise<DeterministicFailure[]> {
  const fails: DeterministicFailure[] = [];
  for (const cve of input.extraction.cves) {
    const normalized = cve.toUpperCase().trim();
    if (!/^CVE-\d{4}-\d{4,}$/.test(normalized)) {
      fails.push({ kind: "invalid_cve", cve });
      continue;
    }
    const ok = await input.cveExists(normalized);
    if (!ok) fails.push({ kind: "invalid_cve", cve: normalized });
  }
  return fails;
}

function checkDateWindow(input: DeterministicInputs): DeterministicFailure[] {
  const { incident_date } = input.extraction;
  if (!incident_date) return [];
  const past = input.datePastDays ?? 90;
  const future = input.dateFutureDays ?? 7;
  const pubMs = Date.parse(input.publishedAt);
  const incMs = Date.parse(incident_date);
  if (Number.isNaN(pubMs) || Number.isNaN(incMs)) return [];
  const minMs = pubMs - past * 86400_000;
  const maxMs = pubMs + future * 86400_000;
  if (incMs < minMs || incMs > maxMs) {
    return [{ kind: "date_out_of_window", incidentDate: incident_date, publishedAt: input.publishedAt }];
  }
  return [];
}

function checkEntitiesInArticle(input: DeterministicInputs): DeterministicFailure[] {
  const threshold = input.entityRatioThreshold ?? 85;
  const fails: DeterministicFailure[] = [];
  const lowerBody = input.rawText.toLowerCase();

  const check = (entities: string[], klass: "victim" | "actor" | "cve") => {
    for (const ent of entities) {
      if (presentInBody(ent, lowerBody, threshold)) continue;
      fails.push({ kind: "entity_not_in_article", entity: ent, entityClass: klass });
    }
  };

  check(input.extraction.victim_orgs_confirmed, "victim");
  check(input.extraction.threat_actors_attributed, "actor");
  // CVE ids — substring match is sufficient (already canonical strings).
  for (const cve of input.extraction.cves) {
    if (lowerBody.includes(cve.toLowerCase())) continue;
    fails.push({ kind: "entity_not_in_article", entity: cve, entityClass: "cve" });
  }
  return fails;
}

/**
 * Entity-in-article presence: literal substring first (fast path), fall back
 * to a sliding-window fuzzy match around 85% similarity. Conservative: the
 * fuzzy path only triggers on short entities (≤ 4 words) to avoid pathological
 * comparison cost on giant bodies.
 */
function presentInBody(entity: string, lowerBody: string, threshold: number): boolean {
  const lowerEnt = entity.toLowerCase();
  if (lowerEnt.length === 0) return true;
  if (lowerBody.includes(lowerEnt)) return true;
  const entWords = lowerEnt.split(/\s+/);
  if (entWords.length > 4) return false;
  const bodyWords = lowerBody.split(/\s+/);
  for (let i = 0; i + entWords.length <= bodyWords.length; i++) {
    const window = bodyWords.slice(i, i + entWords.length).join(" ");
    if (titleRatio(window, lowerEnt) >= threshold) return true;
  }
  return false;
}

function checkClaimLanguageAlignment(input: DeterministicInputs): DeterministicFailure[] {
  if (input.extraction.confidence !== "confirmed") return [];
  const entities = entitiesOfInterest(input.extraction);
  if (entities.length === 0) return [];

  const failures: DeterministicFailure[] = [];
  for (const sentence of splitSentences(input.rawText.toLowerCase())) {
    if (!entities.some((e) => e.length > 0 && sentence.includes(e))) continue;
    const hit = CLAIM_MARKERS.find((m) => sentence.includes(m));
    if (hit) {
      failures.push({ kind: "claim_language_overreach", marker: hit, confidence: input.extraction.confidence });
      break; // one marker-in-entity-sentence is enough to flag
    }
  }
  return failures;
}

function entitiesOfInterest(e: ExtractionOutput): string[] {
  return [...e.victim_orgs_confirmed, ...e.threat_actors_attributed, ...e.cves].map((x) => x.toLowerCase());
}

/** Sentence-level split. Good enough for news articles; we don't need perfect. */
function splitSentences(lowerText: string): string[] {
  return lowerText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
