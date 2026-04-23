// Merge per-chunk ExtractionOutput values into a single extraction, per the
// rules in the approved plan:
//
//   * Arrays: set-union, first-seen order (case-sensitive).
//   * Nullable scalars (initial_access_vector, incident_date, impact.*): first
//     non-null across chunks in order.
//   * confidence: minimum on the ladder claim < reported < confirmed.
//     Preserves the PRD invariant "never flatten claims into confirmations."
//   * title, summary: prefer chunk 0; fall back to first non-empty.
//   * primary_source: mode across chunks; tie → chunk 0.

import type { Confidence, ExtractionImpact, ExtractionOutput } from "../patterns/types.ts";

const CONFIDENCE_ORDER: readonly Confidence[] = ["claim", "reported", "confirmed"];

export function mergeExtractions(chunks: ExtractionOutput[]): ExtractionOutput {
  if (chunks.length === 0) throw new Error("mergeExtractions: no chunks");
  if (chunks.length === 1) return chunks[0]!;

  const chunk0 = chunks[0]!;

  return {
    title: firstNonEmpty(chunks.map((c) => c.title)) ?? chunk0.title,
    summary: firstNonEmpty(chunks.map((c) => c.summary)) ?? chunk0.summary,
    victim_orgs_confirmed: setUnion(chunks.map((c) => c.victim_orgs_confirmed)),
    orgs_mentioned: setUnion(chunks.map((c) => c.orgs_mentioned)),
    threat_actors_attributed: setUnion(chunks.map((c) => c.threat_actors_attributed)),
    actors_mentioned: setUnion(chunks.map((c) => c.actors_mentioned)),
    cves: setUnion(chunks.map((c) => c.cves)),
    initial_access_vector: firstNonNull(chunks.map((c) => c.initial_access_vector)),
    ttps: setUnion(chunks.map((c) => c.ttps)),
    impact: mergeImpact(chunks.map((c) => c.impact)),
    incident_date: firstNonNull(chunks.map((c) => c.incident_date)),
    confidence: minConfidence(chunks.map((c) => c.confidence)),
    claim_markers_observed: setUnion(chunks.map((c) => c.claim_markers_observed)),
    primary_source: modePreferChunk0(chunks.map((c) => c.primary_source)),
  };
}

function setUnion(arrays: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const arr of arrays) {
    for (const x of arr) {
      if (!seen.has(x)) {
        seen.add(x);
        out.push(x);
      }
    }
  }
  return out;
}

function firstNonNull<T>(xs: (T | null)[]): T | null {
  for (const x of xs) if (x !== null) return x;
  return null;
}

function firstNonEmpty(xs: string[]): string | null {
  for (const x of xs) if (x.trim().length > 0) return x;
  return null;
}

function minConfidence(xs: Confidence[]): Confidence {
  let minIdx = CONFIDENCE_ORDER.length - 1;
  for (const c of xs) {
    const i = CONFIDENCE_ORDER.indexOf(c);
    if (i >= 0 && i < minIdx) minIdx = i;
  }
  return CONFIDENCE_ORDER[minIdx]!;
}

function modePreferChunk0<T extends string>(xs: readonly T[]): T {
  const counts = new Map<T, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best = xs[0]!;
  let bestCount = counts.get(best) ?? 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

function mergeImpact(impacts: ExtractionImpact[]): ExtractionImpact {
  return {
    affected_count: firstNonNull(impacts.map((i) => i.affected_count)),
    affected_count_unit: firstNonNull(impacts.map((i) => i.affected_count_unit)),
    data_exfil_size: firstNonNull(impacts.map((i) => i.data_exfil_size)),
    sector: firstNonNull(impacts.map((i) => i.sector)),
    geographic_scope: firstNonNull(impacts.map((i) => i.geographic_scope)),
    service_disruption: firstNonNull(impacts.map((i) => i.service_disruption)),
  };
}
