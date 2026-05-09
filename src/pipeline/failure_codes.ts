// Stable enum of pipeline failure codes + mappers from the existing reason
// shapes to the enum. The codes are the queryable surface for run-log
// aggregation: `jq 'select(.failure_code == "factcheck_invalid_cve")'`.
//
// Three input surfaces with different shapes:
//
//   1. Triage skip `reason` — unconstrained LLM string. Keyword-matched here
//      with a `triage_unhandled` fallback. A follow-up PR may tighten
//      `patterns/triage/schema.json` with a `reason_code` enum, which would
//      replace the keyword path; until then, refine the keyword list as
//      real `triage_unhandled` reasons accumulate in `logs/runs/`.
//   2. Deterministic factcheck `DeterministicFailure["kind"]` — already a
//      typed union (src/factcheck/deterministic.ts:8-12). 1:1 map.
//   3. Reconcile `failureReason` — two literal shapes from
//      src/factcheck/reconcile.ts:58,69. Direct map.
//
// Pattern-runner errors and unhandled exceptions are mapped at the catch
// site in src/pipeline/process.ts via `failureCodeFromError`.

import type { DeterministicFailure } from "../factcheck/deterministic.ts";
import {
  PatternMalformedJsonError,
  PatternSchemaError,
} from "../patterns/runner.ts";

export type FailureCode =
  | "triage_low_severity"
  | "triage_off_topic"
  | "triage_duplicate"
  | "triage_vendor_marketing"
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
