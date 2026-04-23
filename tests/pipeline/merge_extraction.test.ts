import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { mergeExtractions } from "../../src/pipeline/merge_extraction.ts";
import type { ExtractionOutput } from "../../src/patterns/types.ts";

function base(overrides: Partial<ExtractionOutput> = {}): ExtractionOutput {
  return {
    title: "Sample title",
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

describe("mergeExtractions: single chunk passthrough", () => {
  it("returns the sole chunk unchanged", () => {
    const only = base({ victim_orgs_confirmed: ["Cisco"] });
    assert.equal(mergeExtractions([only]), only);
  });

  it("throws on empty input", () => {
    assert.throws(() => mergeExtractions([]), /no chunks/);
  });
});

describe("mergeExtractions: arrays set-union, first-seen order", () => {
  it("preserves first-seen order and deduplicates", () => {
    const c0 = base({ victim_orgs_confirmed: ["Cisco", "Stryker"] });
    const c1 = base({ victim_orgs_confirmed: ["Stryker", "Boeing"] });
    const m = mergeExtractions([c0, c1]);
    assert.deepEqual(m.victim_orgs_confirmed, ["Cisco", "Stryker", "Boeing"]);
  });

  it("is case-sensitive (dedup happens later in entity_resolve)", () => {
    const c0 = base({ threat_actors_attributed: ["ShinyHunters"] });
    const c1 = base({ threat_actors_attributed: ["shinyhunters"] });
    const m = mergeExtractions([c0, c1]);
    assert.deepEqual(m.threat_actors_attributed, ["ShinyHunters", "shinyhunters"]);
  });
});

describe("mergeExtractions: confidence is minimum on the ladder", () => {
  it("confirmed + claim → claim (preserve the 'never flatten' invariant)", () => {
    const c0 = base({ confidence: "confirmed" });
    const c1 = base({ confidence: "claim" });
    assert.equal(mergeExtractions([c0, c1]).confidence, "claim");
  });

  it("confirmed + reported → reported", () => {
    const c0 = base({ confidence: "confirmed" });
    const c1 = base({ confidence: "reported" });
    assert.equal(mergeExtractions([c0, c1]).confidence, "reported");
  });

  it("all confirmed → confirmed", () => {
    const c0 = base({ confidence: "confirmed" });
    const c1 = base({ confidence: "confirmed" });
    assert.equal(mergeExtractions([c0, c1]).confidence, "confirmed");
  });
});

describe("mergeExtractions: nullable scalars take first non-null", () => {
  it("initial_access_vector picks first non-null in order", () => {
    const c0 = base({ initial_access_vector: null });
    const c1 = base({ initial_access_vector: "vishing" });
    const c2 = base({ initial_access_vector: "phishing" });
    assert.equal(mergeExtractions([c0, c1, c2]).initial_access_vector, "vishing");
  });

  it("impact fields merged independently", () => {
    const c0 = base({ impact: { ...base().impact, affected_count: 1000 } });
    const c1 = base({ impact: { ...base().impact, sector: "healthcare" } });
    const m = mergeExtractions([c0, c1]);
    assert.equal(m.impact.affected_count, 1000);
    assert.equal(m.impact.sector, "healthcare");
  });

  it("incident_date follows first-non-null", () => {
    const c0 = base({ incident_date: null });
    const c1 = base({ incident_date: "2026-04-20" });
    assert.equal(mergeExtractions([c0, c1]).incident_date, "2026-04-20");
  });
});

describe("mergeExtractions: title/summary prefer chunk 0", () => {
  it("uses chunk 0 title when non-empty", () => {
    const c0 = base({ title: "Chunk 0 headline" });
    const c1 = base({ title: "Chunk 1 headline" });
    assert.equal(mergeExtractions([c0, c1]).title, "Chunk 0 headline");
  });

  it("falls back to first non-empty when chunk 0 is blank", () => {
    const c0 = base({ title: "  " });
    const c1 = base({ title: "Chunk 1 headline" });
    assert.equal(mergeExtractions([c0, c1]).title, "Chunk 1 headline");
  });
});

describe("mergeExtractions: primary_source mode with chunk-0 tie break", () => {
  it("picks the majority", () => {
    const c0 = base({ primary_source: "aggregated" });
    const c1 = base({ primary_source: "article_itself" });
    const c2 = base({ primary_source: "article_itself" });
    assert.equal(mergeExtractions([c0, c1, c2]).primary_source, "article_itself");
  });

  it("tie-breaks to chunk 0's value", () => {
    const c0 = base({ primary_source: "cited_security_firm" });
    const c1 = base({ primary_source: "cited_vendor_advisory" });
    assert.equal(mergeExtractions([c0, c1]).primary_source, "cited_security_firm");
  });
});
