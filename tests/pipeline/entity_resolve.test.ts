import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createClient, type Client } from "@libsql/client";

import { runMigrations } from "../../scripts/migrate.ts";
import { resolveEntities } from "../../src/pipeline/entity_resolve.ts";

let client: Client;

beforeEach(async () => {
  client = createClient({ url: ":memory:" });
  await runMigrations(client, "migrations");
  // Seed a few canonical aliases.
  const rows = [
    ["Handala", "Void Manticore", "actor", 1.0],
    ["Void Manticore", "Void Manticore", "actor", 1.0],
    ["ShinyHunters", "ShinyHunters", "actor", 1.0],
    ["Fancy Bear", "APT28", "actor", 1.0],
    ["Stryker", "Stryker", "org", 1.0],
  ];
  for (const [alias, canonical, entity_type, confidence] of rows) {
    await client.execute({
      sql: `INSERT INTO entity_aliases (alias, canonical, entity_type, confidence) VALUES (?, ?, ?, ?)`,
      args: [alias as string, canonical as string, entity_type as string, confidence as number],
    });
  }
});

describe("resolveEntities: canonical resolution", () => {
  it("maps a known alias to its canonical", async () => {
    const appended: Array<[string, string]> = [];
    const r = await resolveEntities(
      [{ raw: "Handala", entityType: "actor" }],
      { client, appendFile: async (p, c) => { appended.push([p, c]); } },
    );
    assert.equal(r[0]!.canonical, "Void Manticore");
    assert.equal(r[0]!.known, true);
    assert.equal(appended.length, 0);
  });

  it("is case-insensitive for alias lookups", async () => {
    const r = await resolveEntities(
      [{ raw: "HANDALA", entityType: "actor" }],
      { client, appendFile: async () => {} },
    );
    assert.equal(r[0]!.canonical, "Void Manticore");
  });

  it("does NOT cross entity types", async () => {
    // "Stryker" is seeded as an org; asking for an actor should miss.
    const appended: Array<[string, string]> = [];
    const r = await resolveEntities(
      [{ raw: "Stryker", entityType: "actor" }],
      { client, appendFile: async (p, c) => { appended.push([p, c]); } },
    );
    assert.equal(r[0]!.known, false);
    assert.equal(r[0]!.canonical, "Stryker");
    assert.equal(appended.length, 1);
  });
});

describe("resolveEntities: unknown logging", () => {
  it("logs unknown entities to a JSONL path, one line per unique entity", async () => {
    const appended: Array<[string, string]> = [];
    await resolveEntities(
      [
        { raw: "Nobody McNoOne", entityType: "actor" },
        { raw: "Nobody McNoOne", entityType: "actor" }, // dup in same call
        { raw: "Also Unknown", entityType: "org" },
        { raw: "ShinyHunters", entityType: "actor" }, // known, not logged
      ],
      {
        client,
        appendFile: async (p, c) => { appended.push([p, c]); },
        now: () => new Date("2026-04-22T10:00:00.000Z"),
      },
    );
    assert.equal(appended.length, 1, "one appendFile call per batch");
    const [path, content] = appended[0]!;
    assert.match(path, /logs\/unknown_entities\/2026-04\.jsonl$/);
    const lines = content.trim().split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);
    assert.equal(lines.length, 2);
    assert.deepEqual(new Set(lines.map((l) => l.raw)), new Set(["Nobody McNoOne", "Also Unknown"]));
    assert.ok(lines.every((l) => typeof l.logged_at === "string"));
  });

  it("does nothing when all entities are known", async () => {
    const appended: Array<[string, string]> = [];
    await resolveEntities(
      [
        { raw: "ShinyHunters", entityType: "actor" },
        { raw: "Void Manticore", entityType: "actor" },
      ],
      { client, appendFile: async (p, c) => { appended.push([p, c]); } },
    );
    assert.equal(appended.length, 0);
  });

  it("returns empty for empty input (no I/O)", async () => {
    const appended: Array<[string, string]> = [];
    const r = await resolveEntities([], { client, appendFile: async (p, c) => { appended.push([p, c]); } });
    assert.deepEqual(r, []);
    assert.equal(appended.length, 0);
  });
});

describe("resolveEntities: does not mutate YAML or entity_aliases", () => {
  it("leaves the table unchanged when an unknown is seen", async () => {
    const before = await client.execute(`SELECT COUNT(*) as n FROM entity_aliases`);
    await resolveEntities(
      [{ raw: "Brand New Crew", entityType: "actor" }],
      { client, appendFile: async () => {} },
    );
    const after = await client.execute(`SELECT COUNT(*) as n FROM entity_aliases`);
    assert.equal(Number(before.rows[0]!.n), Number(after.rows[0]!.n));
  });
});
