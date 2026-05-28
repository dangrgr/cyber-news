// Stable enum of pipeline failure codes + mappers from the existing reason
// shapes to the enum. The codes are the queryable surface for run-log
// aggregation: `jq 'select(.failure_code == "factcheck_invalid_cve")'`.
//
// Three input surfaces with different shapes:
//
//   1. Triage skip `reason_code` — enum field added to patterns/triage/schema.json.
//      Direct 1:1 map via `mapTriageReasonCode`. `triage_unhandled` is retained as
//      a defensive fallback for unexpected or null values.
//      `mapTriageReason` (keyword matcher) is kept for backward compatibility only.
//   2. Deterministic factcheck `DeterministicFailure["kind"]` — already a
//      typed union (src/factcheck/deterministic.ts:8-12). 1:1 map.
//   3. Reconcile `failureReason` — two literal shapes from
//      src/factcheck/reconcile.ts:58,69. Direct map.
//
// Pattern-runner errors and unhandled exceptions are mapped at the catch
// site in src/pipeline/process.ts via `failureCodeFromError`.

import type { DeterministicFailure } from "../factcheck/deterministic.ts";
import type { TriageReasonCode } from "../patterns/types.ts";
import {
  PatternMalformedJsonError,
  PatternSchemaError,
} from "../patterns/runner.ts";

export type FailureCode =
  | "triage_low_severity"
  | "triage_off_topic"
  | "triage_duplicate"
  | "triage_vendor_marketing"
  | "triage_not_an_incident"
  | "triage_speculation"
  | "triage_unhandled"
  | "factcheck_invalid_cve"
  | "factcheck_date_out_of_window"
  | "factcheck_entity_not_in_article"
  | "factcheck_claim_overreach"
  | "factcheck_unsupported"
  | "factcheck_reconcile_disagree"
  | "pattern_json_invalid"
  | "pattern_schema_invalid"
  | "unhandled_exception";

/** Primary mapper: direct enum→FailureCode, no keyword guessing. */
export function mapTriageReasonCode(reason_code: TriageReasonCode | null): FailureCode {
  switch (reason_code) {
    case "vendor_marketing": return "triage_vendor_marketing";
    case "not_an_incident":  return "triage_not_an_incident";
    case "off_topic":        return "triage_off_topic";
    case "speculation":      return "triage_speculation";
    case "low_severity":     return "triage_low_severity";
    case "duplicate":        return "triage_duplicate";
    default:                 return "triage_unhandled";
  }
}

/** Backward-compat keyword matcher. Kept for legacy callers and tests;
 *  new code should use `mapTriageReasonCode` with the structured `reason_code` field. */
export function mapTriageReason(reason: string): FailureCode {
  const r = reason.toLowerCase();
  if (r.includes("duplicate")) return "triage_duplicate";
  if (
    r.includes("marketing") ||
    r.includes("promotional") ||
    r.includes("vendor pitch") ||
    r.includes("press release")
  ) {
    return "triage_vendor_marketing";
  }
  if (
    r.includes("low severity") ||
    r.includes("not significant") ||
    r.includes("minor")
  ) {
    return "triage_low_severity";
  }
  if (
    r.includes("off-topic") ||
    r.includes("off topic") ||
    r.includes("not cyber") ||
    r.includes("unrelated") ||
    r.includes("not relevant")
  ) {
    return "triage_off_topic";
  }
  return "triage_unhandled";
}

export function mapDeterministicKind(
  kind: DeterministicFailure["kind"],
): FailureCode {
  switch (kind) {
    case "invalid_cve":
      return "factcheck_invalid_cve";
    case "date_out_of_window":
      return "factcheck_date_out_of_window";
    case "entity_not_in_article":
      return "factcheck_entity_not_in_article";
    case "claim_language_overreach":
      return "factcheck_claim_overreach";
  }
}

/** Shape a `DeterministicFailure` into a run-log detail object with snake_case
 *  keys, matching the casing convention of every other NDJSON field. The typed
 *  union (deterministic.ts) uses camelCase internally; logging it raw would be
 *  the only place a run-log payload leaks an internal type's casing. Exhaustive
 *  switch so a new failure kind forces a decision here rather than silently
 *  re-introducing camelCase. */
export function deterministicFailureDetail(
  f: DeterministicFailure,
): Record<string, unknown> {
  switch (f.kind) {
    case "invalid_cve":
      return { kind: f.kind, cve: f.cve };
    case "date_out_of_window":
      return { kind: f.kind, incident_date: f.incidentDate, published_at: f.publishedAt };
    case "entity_not_in_article":
      return { kind: f.kind, entity: f.entity, entity_class: f.entityClass };
    case "claim_language_overreach":
      return { kind: f.kind, marker: f.marker, confidence: f.confidence };
  }
}

export function mapReconcileReason(reason: string): FailureCode {
  if (reason === "factcheck_unsupported") return "factcheck_unsupported";
  if (reason.startsWith("reconcile_disagree:")) return "factcheck_reconcile_disagree";
  // Unknown shape — bucket as unsupported so it surfaces in the failure_code
  // aggregation instead of vanishing.
  return "factcheck_unsupported";
}

export function failureCodeFromError(err: unknown): FailureCode {
  if (err instanceof PatternMalformedJsonError) return "pattern_json_invalid";
  if (err instanceof PatternSchemaError) return "pattern_schema_invalid";
  return "unhandled_exception";
}
