import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  failureCodeFromError,
  mapDeterministicKind,
  mapReconcileReason,
  mapTriageReason,
  mapTriageReasonCode,
} from "../../src/pipeline/failure_codes.ts";
import {
  PatternMalformedJsonError,
  PatternSchemaError,
} from "../../src/patterns/runner.ts";

describe("mapTriageReasonCode", () => {
  it("maps every enum value to a distinct FailureCode", () => {
    assert.equal(mapTriageReasonCode("vendor_marketing"), "triage_vendor_marketing");
    assert.equal(mapTriageReasonCode("not_an_incident"), "triage_not_an_incident");
    assert.equal(mapTriageReasonCode("off_topic"), "triage_off_topic");
    assert.equal(mapTriageReasonCode("speculation"), "triage_speculation");
    assert.equal(mapTriageReasonCode("low_severity"), "triage_low_severity");
    assert.equal(mapTriageReasonCode("duplicate"), "triage_duplicate");
  });

  it("falls back to triage_unhandled for null (process decision forwarded by mistake)", () => {
    assert.equal(mapTriageReasonCode(null), "triage_unhandled");
  });
});

describe("mapTriageReason", () => {
  it("maps duplicate phrasing to triage_duplicate", () => {
    assert.equal(mapTriageReason("Duplicate of incident-X"), "triage_duplicate");
    assert.equal(mapTriageReason("appears to be a duplicate"), "triage_duplicate");
  });

  it("maps marketing/promotional phrasing to triage_vendor_marketing", () => {
    assert.equal(mapTriageReason("Vendor marketing content."), "triage_vendor_marketing");
    assert.equal(mapTriageReason("Promotional press release"), "triage_vendor_marketing");
  });

  it("maps low-severity phrasing to triage_low_severity", () => {
    assert.equal(mapTriageReason("low severity, minor patch"), "triage_low_severity");
    assert.equal(mapTriageReason("not significant for a public feed"), "triage_low_severity");
  });

  it("maps off-topic phrasing to triage_off_topic", () => {
    assert.equal(mapTriageReason("off-topic for cybersecurity"), "triage_off_topic");
    assert.equal(mapTriageReason("not cyber-related"), "triage_off_topic");
    assert.equal(mapTriageReason("unrelated coverage"), "triage_off_topic");
  });

  it("falls back to triage_unhandled for unrecognized strings", () => {
    assert.equal(mapTriageReason("???"), "triage_unhandled");
    assert.equal(mapTriageReason(""), "triage_unhandled");
    assert.equal(mapTriageReason("Named victim and actor"), "triage_unhandled");
  });

  it("is case-insensitive", () => {
    assert.equal(mapTriageReason("DUPLICATE OF X"), "triage_duplicate");
    assert.equal(mapTriageReason("Marketing Material"), "triage_vendor_marketing");
  });
});

describe("mapDeterministicKind", () => {
  it("maps every DeterministicFailure kind 1:1", () => {
    assert.equal(mapDeterministicKind("invalid_cve"), "factcheck_invalid_cve");
    assert.equal(mapDeterministicKind("date_out_of_window"), "factcheck_date_out_of_window");
    assert.equal(mapDeterministicKind("entity_not_in_article"), "factcheck_entity_not_in_article");
    assert.equal(mapDeterministicKind("claim_language_overreach"), "factcheck_claim_overreach");
  });
});

describe("mapReconcileReason", () => {
  it("maps factcheck_unsupported literal", () => {
    assert.equal(mapReconcileReason("factcheck_unsupported"), "factcheck_unsupported");
  });

  it("maps reconcile_disagree:<fields> prefix", () => {
    assert.equal(mapReconcileReason("reconcile_disagree:summary"), "factcheck_reconcile_disagree");
    assert.equal(
      mapReconcileReason("reconcile_disagree:victim_orgs_confirmed,threat_actors_attributed"),
      "factcheck_reconcile_disagree",
    );
  });

  it("buckets unknown shapes as factcheck_unsupported (does not vanish)", () => {
    assert.equal(mapReconcileReason("something_else"), "factcheck_unsupported");
  });
});

describe("failureCodeFromError", () => {
  it("maps PatternMalformedJsonError to pattern_json_invalid", () => {
    const err = new PatternMalformedJsonError("triage", "{not json", "bad token");
    assert.equal(failureCodeFromError(err), "pattern_json_invalid");
  });

  it("maps PatternSchemaError to pattern_schema_invalid", () => {
    const err = new PatternSchemaError("extract", "{}", [{ path: "$", message: "missing field" }]);
    assert.equal(failureCodeFromError(err), "pattern_schema_invalid");
  });

  it("falls back to unhandled_exception for generic errors", () => {
    assert.equal(failureCodeFromError(new Error("boom")), "unhandled_exception");
    assert.equal(failureCodeFromError("string error"), "unhandled_exception");
    assert.equal(failureCodeFromError(undefined), "unhandled_exception");
  });
});
