import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient, type Client } from "@libsql/client";

import { runMigrations } from "../../scripts/migrate.ts";
import {
  insertIncident,
  getIncident,
  addSourceToIncident,
  setDiscordMessageId,
  setCorroborationCounts,
} from "../../src/turso/incidents.ts";

let client: Client;

beforeEach(async () => {
  client = createClient({ url: ":memory:" });
  await runMigrations(client, "migrations");
});

function sampleIncident(id = "inc-1") {
  return {
    id,
    title: "Stryker wiper attack",
    summary: "Handala claims ~50TB exfil, confirmed Intune wipe.",
    incidentDate: "2026-03-11",
    confidence: "confirmed" as const,
    victimOrgsConfirmed: ["Stryker"],
    orgsMentioned: ["Lockheed Martin"],
    threatActorsAttributed: ["Handala"],
    actorsMentioned: ["Void Manticore"],
    cves: [],
    initialAccessVector: "Entra/Intune Global Admin provisioning",
    ttps: ["T1485"],
    impactJson: JSON.stringify({ affected_count: 200000, sector: "medical devices" }),
    claimMarkersObserved: ["claims"],
    primarySource: "article_itself",
    sourceUrls: ["https://krebsonsecurity.com/2026/stryker"],
  };
}

describe("incidents repo", () => {
  it("inserts and reads back with split fields preserved", async () => {
    await insertIncident(client, sampleIncident());
    const row = await getIncident(client, "inc-1");
    assert.ok(row);
    assert.deepEqual(row!.victim_orgs_confirmed, ["Stryker"]);
    assert.deepEqual(row!.orgs_mentioned, ["Lockheed Martin"]);
    assert.deepEqual(row!.threat_actors_attributed, ["Handala"]);
    assert.deepEqual(row!.actors_mentioned, ["Void Manticore"]);
    assert.equal(row!.confidence, "confirmed");
    assert.equal(row!.corroboration_count, 1);
  });

  it("populates the legacy victim_orgs/threat_actors columns as union-of-split", async () => {
    await insertIncident(client, sampleIncident());
    const res = await client.execute(`SELECT victim_orgs, threat_actors FROM incidents WHERE id = 'inc-1'`);
    const vo = JSON.parse(String(res.rows[0]!.victim_orgs)) as string[];
    const ta = JSON.parse(String(res.rows[0]!.threat_actors)) as string[];
    assert.deepEqual(vo.sort(), ["Lockheed Martin", "Stryker"]);
    assert.deepEqual(ta.sort(), ["Handala", "Void Manticore"]);
  });

  it("ON CONFLICT DO NOTHING — insert twice, second is a no-op", async () => {
    const ok1 = await insertIncident(client, sampleIncident());
    const ok2 = await insertIncident(client, sampleIncident());
    assert.equal(ok1, true);
    assert.equal(ok2, false);
  });

  it("addSourceToIncident appends and bumps corroboration_count", async () => {
    await insertIncident(client, sampleIncident());
    await addSourceToIncident(client, "inc-1", "https://bleepingcomputer.com/stryker");
    const row = await getIncident(client, "inc-1");
    assert.deepEqual(row!.source_urls, [
      "https://krebsonsecurity.com/2026/stryker",
      "https://bleepingcomputer.com/stryker",
    ]);
    assert.equal(row!.corroboration_count, 2);
  });

  it("addSourceToIncident is idempotent on the same URL", async () => {
    await insertIncident(client, sampleIncident());
    await addSourceToIncident(client, "inc-1", "https://krebsonsecurity.com/2026/stryker");
    const row = await getIncident(client, "inc-1");
    assert.equal(row!.source_urls.length, 1);
    assert.equal(row!.corroboration_count, 1);
  });

  it("setDiscordMessageId persists", async () => {
    await insertIncident(client, sampleIncident());
    await setDiscordMessageId(client, "inc-1", "discord-msg-42");
    const row = await getIncident(client, "inc-1");
    assert.equal(row!.discord_message_id, "discord-msg-42");
  });

  it("setCorroborationCounts persists tier1/tier2", async () => {
    await insertIncident(client, sampleIncident());
    await setCorroborationCounts(client, "inc-1", 3, 2);
    const row = await getIncident(client, "inc-1");
    assert.equal(row!.corroboration_tier1, 3);
    assert.equal(row!.corroboration_tier2, 2);
  });
});
