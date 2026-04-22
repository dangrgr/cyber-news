import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { scorePrefilter, SCORE_THRESHOLD, WEIGHTS } from "../src/pipeline/prefilter.ts";
import {
  ALIASES,
  A_KREBS_SHINY,
  A_DARKREADING_DIFFERENT_STORY,
  A_VENDOR_MARKETING,
} from "./fixtures/articles.ts";

describe("scorePrefilter: signal extraction", () => {
  it("extracts CVEs case-insensitively and dedupes them", () => {
    const r = scorePrefilter({
      title: "Patch advisory",
      body: "Affected: cve-2026-1234 and CVE-2026-1234 and CVE-2025-9999.",
      sourceTier: "secondary",
      entityAliases: [],
    });
    assert.deepEqual(r.cves.sort(), ["CVE-2025-9999", "CVE-2026-1234"]);
  });

  it("matches multi-word entity aliases with word boundaries", () => {
    const r = scorePrefilter({
      title: "Iranian Wiper",
      body: "The group, tracked as Void Manticore, conducted destructive ops via Handala.",
      sourceTier: "secondary",
      entityAliases: ALIASES,
    });
    assert.ok(r.entityHits.includes("Void Manticore"));
    assert.ok(r.entityHits.includes("Handala"));
  });

  it("does not over-match entity aliases on substrings", () => {
    // "rapt28scan" must not trigger an APT28 hit.
    const r = scorePrefilter({
      title: "Tool review",
      body: "We tested rapt28scan against several enterprise networks.",
      sourceTier: "secondary",
      entityAliases: ALIASES,
    });
    assert.ok(!r.entityHits.includes("APT28"), `unexpected APT28 hit: ${r.entityHits.join(",")}`);
  });

  it("counts high-signal keywords from PRD §8.3", () => {
    const r = scorePrefilter({
      title: "Big breach",
      body: "Ransomware operators claim exfiltration of customer records via a zero-day exploit.",
      sourceTier: "secondary",
      entityAliases: [],
    });
    // ransomware, breach, exfiltration, zero-day, exploit
    assert.ok(r.keywordHits.length >= 5, `expected >=5 keyword hits, got ${r.keywordHits.length}`);
  });
});

describe("scorePrefilter: scoring math (PRD §8.3)", () => {
  it("score = weights * counts (no source bonus on secondary)", () => {
    const aliases = ["Cisco", "Salesforce"];
    const r = scorePrefilter({
      title: "Cisco breached via Salesforce",
      body: "Vishing-led intrusion against Cisco Salesforce. CVE-2026-1234 cited.",
      sourceTier: "secondary",
      entityAliases: aliases,
    });
    // 1 CVE + 2 entity hits + several keyword hits, no primary bonus.
    const expectedMin =
      WEIGHTS.cvePresent + WEIGHTS.perEntityHit * r.entityHits.length + WEIGHTS.perKeywordHit * r.keywordHits.length;
    assert.equal(r.score, Math.round(expectedMin * 100) / 100);
    assert.equal(r.passed, true);
  });

  it("adds the +0.3 primary-source bonus only for primary sources", () => {
    // Body deliberately free of CVEs / known entities / signal keywords so the
    // only score difference between the two runs is the primary-source bonus.
    const noiseInput = {
      title: "Industry roundup",
      body: "A roundup of recent partnerships and product launches.",
      entityAliases: [] as string[],
    };
    const secondary = scorePrefilter({ ...noiseInput, sourceTier: "secondary" });
    const primary = scorePrefilter({ ...noiseInput, sourceTier: "primary" });
    assert.equal(secondary.score, 0);
    assert.equal(primary.score, WEIGHTS.primarySource);
  });
});

describe("scorePrefilter: pass/skip outcomes", () => {
  it("passes a real article with CVE + entities + keywords (Krebs/ShinyHunters/Cisco)", () => {
    const r = scorePrefilter({
      title: A_KREBS_SHINY.title,
      body: A_KREBS_SHINY.body,
      sourceTier: A_KREBS_SHINY.source_tier,
      entityAliases: ALIASES,
    });
    assert.equal(r.passed, true);
    assert.ok(r.score >= SCORE_THRESHOLD);
    assert.ok(r.cves.length > 0);
    assert.ok(r.entityHits.length > 0);
  });

  it("passes a Volt Typhoon advisory (entity hit alone is enough)", () => {
    const r = scorePrefilter({
      title: A_DARKREADING_DIFFERENT_STORY.title,
      body: A_DARKREADING_DIFFERENT_STORY.body,
      sourceTier: A_DARKREADING_DIFFERENT_STORY.source_tier,
      entityAliases: ALIASES,
    });
    assert.equal(r.passed, true, `score=${r.score} reason=${r.reason}`);
  });

  it("skips vendor marketing with no CVE / entity / strong keyword", () => {
    const r = scorePrefilter({
      title: A_VENDOR_MARKETING.title,
      body: A_VENDOR_MARKETING.body,
      sourceTier: A_VENDOR_MARKETING.source_tier,
      entityAliases: ALIASES,
    });
    assert.equal(r.passed, false, `score=${r.score} reason=${r.reason}`);
    assert.equal(r.cves.length, 0);
    assert.equal(r.entityHits.length, 0);
  });
});
