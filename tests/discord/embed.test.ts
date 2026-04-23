import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { composeEmbed } from "../../src/discord/embed.ts";
import type { IncidentRow } from "../../src/turso/incidents.ts";

function incident(overrides: Partial<IncidentRow> = {}): IncidentRow {
  return {
    id: "inc-stryker-2026-03",
    first_seen_at: "2026-03-11T00:00:00Z",
    last_updated_at: "2026-03-11T00:00:00Z",
    title: "Stryker wiper attack: 200k devices wiped",
    summary: "Handala claims ~50TB exfil pre-wipe. Stryker confirmed mass Intune wipe.",
    incident_date: "2026-03-11",
    confidence: "confirmed",
    victim_orgs_confirmed: ["Stryker"],
    orgs_mentioned: [],
    threat_actors_attributed: ["Handala"],
    actors_mentioned: ["Void Manticore"],
    cves: [],
    initial_access_vector: "Entra/Intune Global Admin provisioning",
    ttps: [],
    impact_json: null,
    campaign_tags: [],
    claim_markers_observed: ["claims"],
    primary_source: "article_itself",
    corroboration_count: 3,
    corroboration_tier1: 2,
    corroboration_tier2: 1,
    source_urls: [
      "https://krebsonsecurity.com/2026/stryker",
      "https://therecord.media/stryker-wiper",
      "https://bleepingcomputer.com/stryker",
    ],
    discord_message_id: null,
    investigation_status: "none",
    ...overrides,
  };
}

describe("composeEmbed: structure", () => {
  it("returns exactly one embed in the payload", () => {
    const r = composeEmbed(incident(), [], { tier1: 0, tier2: 0 });
    assert.equal(r.embeds?.length, 1);
  });

  it("footer carries incident_id for future investigation dispatch", () => {
    const r = composeEmbed(incident(), [], { tier1: 0, tier2: 0 });
    assert.equal(r.embeds![0]!.footer?.text, "incident_id=inc-stryker-2026-03");
  });

  it("url points at source zero", () => {
    const r = composeEmbed(
      incident({ source_urls: ["https://krebsonsecurity.com/foo"] }),
      [{ name: "Krebs on Security", url: "https://krebsonsecurity.com/foo" }],
      { tier1: 0, tier2: 0 },
    );
    assert.equal(r.embeds![0]!.url, "https://krebsonsecurity.com/foo");
  });
});

describe("composeEmbed: confidence dot", () => {
  it("🟢 for confirmed", () => {
    const r = composeEmbed(incident({ confidence: "confirmed" }), [], { tier1: 0, tier2: 0 });
    assert.match(r.embeds![0]!.title!, /^🟢 /);
  });

  it("🟡 for reported", () => {
    const r = composeEmbed(incident({ confidence: "reported" }), [], { tier1: 0, tier2: 0 });
    assert.match(r.embeds![0]!.title!, /^🟡 /);
  });

  it("🔴 for claim", () => {
    const r = composeEmbed(incident({ confidence: "claim" }), [], { tier1: 0, tier2: 0 });
    assert.match(r.embeds![0]!.title!, /^🔴 /);
  });
});

describe("composeEmbed: corroboration dot", () => {
  it("🟢 when distinct sources + tier counts total ≥3", () => {
    const sources = [
      { name: "Krebs on Security", url: "https://krebsonsecurity.com/x" },
    ];
    const r = composeEmbed(incident(), sources, { tier1: 2, tier2: 0 });
    assert.match(r.embeds![0]!.description!, /🟢 3 corroborating/);
  });

  it("🟡 when total is exactly 2", () => {
    const sources = [{ name: "Krebs on Security", url: "https://k.com" }];
    const r = composeEmbed(incident(), sources, { tier1: 1, tier2: 0 });
    assert.match(r.embeds![0]!.description!, /🟡 2 corroborating/);
  });

  it("🔴 when only 1 source and no corroboration", () => {
    const sources = [{ name: "Krebs on Security", url: "https://k.com" }];
    const r = composeEmbed(incident(), sources, { tier1: 0, tier2: 0 });
    assert.match(r.embeds![0]!.description!, /🔴 1 corroborating/);
  });
});

describe("composeEmbed: body lines", () => {
  it("lists threat actors on the Actor line", () => {
    const r = composeEmbed(
      incident({ threat_actors_attributed: ["ShinyHunters", "Scattered Spider"] }),
      [],
      { tier1: 0, tier2: 0 },
    );
    assert.match(r.embeds![0]!.description!, /\*\*Actor:\*\* ShinyHunters, Scattered Spider/);
  });

  it("shows 'none' for empty CVEs", () => {
    const r = composeEmbed(incident({ cves: [] }), [], { tier1: 0, tier2: 0 });
    assert.match(r.embeds![0]!.description!, /\*\*CVEs:\*\* none/);
  });

  it("shows CVEs comma-separated when present", () => {
    const r = composeEmbed(
      incident({ cves: ["CVE-2026-31200", "CVE-2026-31201"] }),
      [],
      { tier1: 0, tier2: 0 },
    );
    assert.match(r.embeds![0]!.description!, /CVE-2026-31200, CVE-2026-31201/);
  });

  it("shows 'n/a' for null access vector", () => {
    const r = composeEmbed(incident({ initial_access_vector: null }), [], { tier1: 0, tier2: 0 });
    assert.match(r.embeds![0]!.description!, /\*\*Access:\*\* n\/a/);
  });

  it("shows 'unknown' for null incident_date", () => {
    const r = composeEmbed(incident({ incident_date: null }), [], { tier1: 0, tier2: 0 });
    assert.match(r.embeds![0]!.description!, /\*\*Incident date:\*\* unknown/);
  });

  it("ends with a [Read source](url) link", () => {
    const r = composeEmbed(
      incident(),
      [{ name: "Krebs on Security", url: "https://krebsonsecurity.com/stryker" }],
      { tier1: 0, tier2: 0 },
    );
    assert.match(r.embeds![0]!.description!, /\[Read source\]\(https:\/\/krebsonsecurity\.com\/stryker\)$/);
  });
});
