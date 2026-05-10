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
    // Close paraphrase — should still be ≥70% similar.
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

  // Regression: titleRatio is LCS-based and was tuned for short-title dedup. Two
  // LLM extracts that summarize the same article in different word order
  // routinely score 75-83. The two cases below were observed in logs/runs/
  // 2026-05-10/ as factcheck_reconcile_disagree failures with no real semantic
  // disagreement — both should publish with the lowered threshold.
  it("summary publishes for paraphrased equivalents — observed Mac-malware case (run 900bf7f2)", async () => {
    const e1 = extraction({
      summary:
        "Attackers are conducting a malvertising campaign that abuses Google Ads and Claude.ai shared chats to distribute macOS malware. Users searching for 'Claude mac download' encounter sponsored results pointing to claude.ai that contain malicious installation instructions. The campaign was identified by Berk Albayrak, a security engineer at Trendyol Group. Two variants of the attack were found using different infrastructure; one variant checks for Russian or CIS-region keyboard configurations before executing, while the other skips profiling and directly harvests browser credentials, cookies, and macOS Keychain contents, exfiltrating them to attacker servers. The malware is identified as a variant of MacSync macOS infostealer.",
    });
    const e2 = extraction({
      summary:
        "Attackers are conducting a malvertising campaign that abuses Google Ads and Claude.ai shared chats to distribute macOS malware. Users searching for 'Claude mac download' encounter sponsored results pointing to claude.ai that contain malicious installation instructions. The campaign was identified by Berk Albayrak, a security engineer at Trendyol Group. BleepingComputer identified a second variant using separate infrastructure. The malware, identified as a variant of MacSync infostealer, harvests browser credentials, cookies, and macOS Keychain contents. One variant includes victim profiling that checks for Russian or CIS-region keyboard configurations before payload delivery.",
    });
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

  it("summary publishes for paraphrased equivalents — observed Crimenetwork case (run 47fe4c62)", async () => {
    const e1 = extraction({
      summary:
        "German authorities shut down a rebooted version of the Crimenetwork cybercrime marketplace that had generated at least €3.6 million in revenue and arrested its 35-year-old administrator in Mallorca, Spain. The new version emerged within days of the original platform's dismantling in late 2024 and had accumulated 22,000 users and over 100 vendors before being seized.",
    });
    const e2 = extraction({
      summary:
        "German authorities shut down a rebooted version of the Crimenetwork cybercrime marketplace that had generated at least €3.6 million in revenue and arrested its 35-year-old administrator. The new version, which emerged days after the original platform's dismantling in late 2024, had amassed 22,000 users and over 100 vendors before being seized. The arrested operator faces charges under German criminal law and narcotics legislation.",
    });
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

  it("summary still fails when extractions genuinely contradict", async () => {
    // Opposite-meaning summaries about the same incident. titleRatio should be
    // well under 70 — guards against the threshold being lowered too far.
    const e1 = extraction({
      summary: "Cisco confirmed it was breached and 4.2 million customer records were stolen.",
    });
    const e2 = extraction({
      summary: "Cisco denied any breach occurred and called the ShinyHunters claims fabricated.",
    });
    const f = factcheck([
      { field: "summary", verdict: "OVERREACH", article_evidence: null, detail: "..." },
    ]);
    const decision = await reconcile({
      extraction1: e1,
      factcheck1: f,
      reRunExtract: async () => e2,
    });
    assert.equal(decision.kind, "fail");
  });

  // Regression: ttps are free-text labels generated by the model, with no
  // controlled vocabulary. Two stochastic extracts routinely produce
  // semantically-overlapping but lexically-distinct sets ("Money laundering"
  // vs "Infrastructure administration" — both supported by an article about a
  // criminal marketplace). Strict set equality on those will keep blocking
  // legitimate publishes. Factcheck's own per-field UNSUPPORTED check already
  // guards against ttps that aren't in the article.
  it("disagreeing ttps no longer block publish when other flagged fields agree", async () => {
    const e1 = extraction({
      confidence: "confirmed",
      ttps: ["Phishing", "Credential theft", "Money laundering"],
    });
    const e2 = extraction({
      confidence: "confirmed",
      ttps: ["Phishing", "Credential theft", "Infrastructure administration"],
    });
    const f = factcheck([
      { field: "ttps", verdict: "OVERREACH", article_evidence: null, detail: "..." },
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
