import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { IncidentRow } from "../../src/turso/incidents.ts";
import { reconstructExtraction } from "../../src/investigate/reconstruct_extraction.ts";

function incident(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: "inc-1",
    first_seen_at: "2026-03-11T09:00:00Z",
    last_updated_at: "2026-03-11T09:00:00Z",
    title: "Stryker wiper attack",
    summary: "Handala claims ~50TB exfil, confirmed Intune wipe.",
    incident_date: "2026-03-11",
    confidence: "confirmed",
    victim_orgs_confirmed: ["Stryker"],
    orgs_mentioned: ["Lockheed Martin"],
    threat_actors_attributed: ["Handala"],
    actors_mentioned: ["Void Manticore"],
    cves: [],
    initial_access_vector: "Entra/Intune Global Admin provisioning",
    ttps: ["T1485"],
    impact_json: JSON.stringify({
      affected_count: 200000,
      affected_count_unit: "devices",
      data_exfil_size: "50TB",
      sector: "medical devices",
      geographic_scope: "79 countries",
      service_disruption: "operational disruption",
    }),
    campaign_tags: ["Handala-Retaliation-2026"],
    claim_markers_observed: ["claims"],
    primary_source: "article_itself",
    corroboration_count: 3,
    corroboration_tier1: 1,
    corroboration_tier2: 2,
    source_urls: ["https://krebsonsecurity.com/2026/stryker"],
    discord_message_id: null,
    investigation_status: "none",
    ...overrides,
  };
}

describe("reconstructExtraction", () => {
  it("restores the co-mention-split fields", () => {
    const e = reconstructExtraction(incident());
    assert.deepEqual(e.victim_orgs_confirmed, ["Stryker"]);
    assert.deepEqual(e.orgs_mentioned, ["Lockheed Martin"]);
    assert.deepEqual(e.threat_actors_attributed, ["Handala"]);
    assert.deepEqual(e.actors_mentioned, ["Void Manticore"]);
  });

  it("parses impact_json JSON into the structured impact object", () => {
    const e = reconstructExtraction(incident());
    assert.equal(e.impact.affected_count, 200000);
    assert.equal(e.impact.affected_count_unit, "devices");
    assert.equal(e.impact.data_exfil_size, "50TB");
    assert.equal(e.impact.geographic_scope, "79 countries");
  });

  it("falls back to all-null impact when impact_json is null", () => {
    const e = reconstructExtraction(incident({ impact_json: null }));
    assert.equal(e.impact.affected_count, null);
    assert.equal(e.impact.sector, null);
  });

  it("falls back to all-null impact when impact_json is malformed", () => {
    const e = reconstructExtraction(incident({ impact_json: "{not json" }));
    assert.equal(e.impact.affected_count, null);
  });

  it("defaults primary_source to article_itself when null", () => {
    const e = reconstructExtraction(incident({ primary_source: null }));
    assert.equal(e.primary_source, "article_itself");
  });

  it("preserves confidence and claim markers", () => {
    const e = reconstructExtraction(incident({ confidence: "claim", claim_markers_observed: ["alleges", "reportedly"] }));
    assert.equal(e.confidence, "claim");
    assert.deepEqual(e.claim_markers_observed, ["alleges", "reportedly"]);
  });
});
