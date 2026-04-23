import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runDeterministic } from "../../src/factcheck/deterministic.ts";
import type { ExtractionOutput } from "../../src/patterns/types.ts";

function baseExtraction(overrides: Partial<ExtractionOutput> = {}): ExtractionOutput {
  return {
    title: "Sample",
    summary: "Sample summary.",
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

const neverExists = async (_id: string): Promise<boolean> => false;
const alwaysExists = async (_id: string): Promise<boolean> => true;

describe("deterministic: CVE validity", () => {
  it("passes when every CVE is known to NVD", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({ cves: ["CVE-2026-31200"] }),
      rawText: "Fortinet disclosed CVE-2026-31200.",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, true);
  });

  it("fails with invalid_cve when NVD does not know the id", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({ cves: ["CVE-2026-99999"] }),
      rawText: "CVE-2026-99999 per the article.",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: neverExists,
    });
    assert.equal(r.pass, false);
    assert.ok(r.failures.some((f) => f.kind === "invalid_cve"));
  });

  it("rejects a malformed CVE id without calling the existence check", async () => {
    let called = false;
    const r = await runDeterministic({
      extraction: baseExtraction({ cves: ["CVE-BAD"] }),
      rawText: "CVE-BAD",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: async () => {
        called = true;
        return true;
      },
    });
    assert.equal(r.pass, false);
    assert.equal(called, false);
  });
});

describe("deterministic: date window", () => {
  it("passes when incident_date is within window", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({ incident_date: "2026-03-11" }),
      rawText: "",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, true);
  });

  it("fails when incident_date is older than 90 days", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({ incident_date: "2025-01-01" }),
      rawText: "",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, false);
    assert.ok(r.failures.some((f) => f.kind === "date_out_of_window"));
  });

  it("fails when incident_date is more than 7 days in the future", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({ incident_date: "2026-05-10" }),
      rawText: "",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, false);
  });

  it("ignores null incident_date", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({ incident_date: null }),
      rawText: "",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, true);
  });
});

describe("deterministic: entity-in-article", () => {
  it("passes when every victim/actor/CVE substring is present", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({
        victim_orgs_confirmed: ["Cisco"],
        threat_actors_attributed: ["ShinyHunters"],
        cves: ["CVE-2026-31200"],
      }),
      rawText: "ShinyHunters claims a Cisco breach, CVE-2026-31200 was involved.",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, true);
  });

  it("fails when a victim isn't in the article", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({ victim_orgs_confirmed: ["Boeing"] }),
      rawText: "ShinyHunters claims a Cisco breach.",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.ok(r.failures.some((f) => f.kind === "entity_not_in_article" && f.entity === "Boeing"));
  });

  it("accepts minor case/punctuation drift via ~85% fuzzy match", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({ victim_orgs_confirmed: ["SolarWinds"] }),
      rawText: "the solarwinds incident remains under investigation",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, true);
  });
});

describe("deterministic: claim-language alignment", () => {
  it("fails when confidence=confirmed but article uses claim markers near an entity", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({
        confidence: "confirmed",
        victim_orgs_confirmed: ["Cisco"],
        threat_actors_attributed: ["ShinyHunters"],
      }),
      rawText: "ShinyHunters claims to have breached Cisco, exfiltrating records from Salesforce.",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.ok(r.failures.some((f) => f.kind === "claim_language_overreach"));
  });

  it("passes when confidence<confirmed even with claim markers", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({
        confidence: "claim",
        victim_orgs_confirmed: ["Cisco"],
        threat_actors_attributed: ["ShinyHunters"],
      }),
      rawText: "ShinyHunters claims to have breached Cisco.",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, true);
  });

  it("ignores a claim marker unrelated to any flagged entity", async () => {
    const r = await runDeterministic({
      extraction: baseExtraction({
        confidence: "confirmed",
        victim_orgs_confirmed: ["Cisco"],
      }),
      rawText:
        "Cisco confirmed the unauthorized access. Separately, in an unrelated context, a recipe book allegedly copied another.",
      publishedAt: "2026-04-22T00:00:00Z",
      cveExists: alwaysExists,
    });
    assert.equal(r.pass, true);
  });
});
