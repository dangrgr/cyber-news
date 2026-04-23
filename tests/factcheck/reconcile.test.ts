import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  reconcile,
  computeFlaggedFields,
  findDisagreements,
  downgradeConfidence,
} from "../../src/factcheck/reconcile.ts";
import type { ExtractionOutput, FactcheckOutput } from "../../src/patterns/types.ts";

function extraction(overrides: Partial<ExtractionOutput> = {}): ExtractionOutput {
  return {
    title: "T",
    summary: "S",
    victim_orgs_confirmed: [],
    orgs_mentioned: [],
    threat_actors_attributed: [],
    actors_mentioned: [],
    cves: [],
    initial_access_vector: null,
    ttps: [],
    impact: {
      affected_count: null,
      affected_count_unit: null,
      data_exfil_size: null,
      sector: null,
      geographic_scope: null,
      service_disruption: null,
    },
    incident_date: null,
    confidence: "reported",
    claim_markers_observed: [],
    primary_source: "article_itself",
    ...overrides,
  };
}

function factcheck(issues: FactcheckOutput["issues"], overall: "pass" | "fail" = "fail"): FactcheckOutput {
  return { overall, issues };
}

describe("computeFlaggedFields", () => {
  it("flags OVERREACH fields directly", () => {
    const f = factcheck([
      { field: "confidence", verdict: "OVERREACH", article_evidence: null, detail: "..." },
    ]);
    assert.deepEqual([...computeFlaggedFields(f)], ["confidence"]);
  });

  it("flags both sides on RELATIONSHIP_UNSUPPORTED", () => {
    const f = factcheck([
      { field: "rel:ShinyHunters:Cisco", verdict: "RELATIONSHIP_UNSUPPORTED", article_evidence: null, detail: "..." },
    ]);
    assert.deepEqual(
      new Set(computeFlaggedFields(f)),
      new Set(["threat_actors_attributed", "victim_orgs_confirmed"]),
    );
  });

  it("ignores UNSUPPORTED (not eligible for reconcile)", () => {
    const f = factcheck([
      { field: "summary", verdict: "UNSUPPORTED", article_evidence: null, detail: "..." },
    ]);
    assert.equal(computeFlaggedFields(f).size, 0);
  });
});

describe("downgradeConfidence", () => {
  it("confirmed + confirmed → reported (one rung)", () => {
    assert.equal(downgradeConfidence("confirmed", "confirmed"), "reported");
  });

  it("confirmed + reported → claim (min is reported, one rung down)", () => {
    assert.equal(downgradeConfidence("confirmed", "reported"), "claim");
  });

  it("claim + anything → claim (already floor)", () => {
    assert.equal(downgradeConfidence("claim", "confirmed"), "claim");
    assert.equal(downgradeConfidence("claim", "claim"), "claim");
  });
});

describe("reconcile decisions", () => {
  it("publish when no flagged fields and overall=pass", async () => {
    const e = extraction();
    const f = factcheck([], "pass");
    const decision = await reconcile({
      extraction1: e,
      factcheck1: f,
      reRunExtract: async () => {
        throw new Error("should not re-run");
      },
    });
    assert.equal(decision.kind, "publish");
    if (decision.kind === "publish") {
      assert.equal(decision.downgraded, false);
    }
  });

  it("fail with factcheck_unsupported when only UNSUPPORTED issues exist", async () => {
    const e = extraction();
    const f = factcheck([
      { field: "incident_date", verdict: "UNSUPPORTED", article_evidence: null, detail: "..." },
    ]);
    const decision = await reconcile({
      extraction1: e,
      factcheck1: f,
      reRunExtract: async () => {
        throw new Error("should not re-run");
      },
    });
    assert.equal(decision.kind, "fail");
    if (decision.kind === "fail") {
      assert.equal(decision.failureReason, "factcheck_unsupported");
    }
  });

  it("publish with downgrade when reconcile re-run agrees on flagged fields", async () => {
    const e1 = extraction({ confidence: "confirmed", summary: "Cisco was breached." });
    const e2 = extraction({ confidence: "confirmed", summary: "Cisco was breached." });
    const f = factcheck([
      { field: "confidence", verdict: "OVERREACH", article_evidence: null, detail: "claim markers present" },
    ]);
    const decision = await reconcile({
      extraction1: e1,
      factcheck1: f,
      reRunExtract: async () => e2,
    });
    assert.equal(decision.kind, "publish");
    if (decision.kind === "publish") {
      assert.equal(decision.downgraded, true);
      assert.equal(decision.extraction.confidence, "reported");
    }
  });

  it("fail with reconcile_disagree when flagged fields disagree", async () => {
    const e1 = extraction({ confidence: "confirmed", victim_orgs_confirmed: ["Cisco"] });
    const e2 = extraction({ confidence: "reported", victim_orgs_confirmed: ["Cisco"] });
    const f = factcheck([
      { field: "confidence", verdict: "OVERREACH", article_evidence: null, detail: "..." },
    ]);
    const decision = await reconcile({
      extraction1: e1,
      factcheck1: f,
      reRunExtract: async () => e2,
    });
    assert.equal(decision.kind, "fail");
    if (decision.kind === "fail") {
      assert.match(decision.failureReason, /reconcile_disagree:confidence/);
    }
  });

  it("treats RELATIONSHIP disagreement on actor/victim arrays correctly", async () => {
    const e1 = extraction({
      victim_orgs_confirmed: ["Cisco"],
      threat_actors_attributed: ["ShinyHunters"],
    });
    const e2 = extraction({
      victim_orgs_confirmed: ["Boeing"], // disagrees
      threat_actors_attributed: ["ShinyHunters"],
    });
    const f = factcheck([
      { field: "rel:actor:victim", verdict: "RELATIONSHIP_UNSUPPORTED", article_evidence: null, detail: "..." },
    ]);
    const decision = await reconcile({
      extraction1: e1,
      factcheck1: f,
      reRunExtract: async () => e2,
    });
    assert.equal(decision.kind, "fail");
  });

  it("summary uses fuzzy agreement, not exact equality", async () => {
    const e1 = extraction({ summary: "ShinyHunters claims a Cisco breach with 4.2M records." });
    // Close paraphrase — should still be ≥85% similar.
    const e2 = extraction({ summary: "ShinyHunters claims a Cisco breach with 4.2M records exfiltrated." });
    const f = factcheck([
      { field: "summary", verdict: "OVERREACH", article_evidence: null, detail: "..." },
    ]);
    const decision = await reconcile({
      extraction1: e1,
      factcheck1: f,
      reRunExtract: async () => e2,
    });
    assert.equal(decision.kind, "publish");
  });
});

describe("findDisagreements: case-insensitive set equality", () => {
  it("ShinyHunters vs shinyhunters: agree", () => {
    const e1 = extraction({ threat_actors_attributed: ["ShinyHunters"] });
    const e2 = extraction({ threat_actors_attributed: ["shinyhunters"] });
    assert.deepEqual(
      findDisagreements(e1, e2, new Set(["threat_actors_attributed"])),
      [],
    );
  });

  it("different sets: disagree", () => {
    const e1 = extraction({ cves: ["CVE-2026-1"] });
    const e2 = extraction({ cves: ["CVE-2026-2"] });
    assert.deepEqual(
      findDisagreements(e1, e2, new Set(["cves"])),
      ["cves"],
    );
  });
});
