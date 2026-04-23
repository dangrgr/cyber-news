// Fixture articles for dedup + pre-filter tests. Hand-written; not real fetches.
// Kept tight on purpose — tests should fail loudly when behavior changes, so the
// inputs need to be small enough to read in one screen.

import type { SourceTier } from "../../src/ingest/sources.ts";

export interface ArticleFixture {
  source_id: string;
  source_tier: SourceTier;
  url: string;
  title: string;
  publishedAt: string;
  body: string;
}

export const ALIASES = [
  // From entities.yaml — actors
  "Void Manticore",
  "Handala",
  "Handala Hack Team",
  "ShinyHunters",
  "Scattered Spider",
  "UNC3944",
  "Octo Tempest",
  "APT28",
  "Fancy Bear",
  "Volt Typhoon",
  "Salt Typhoon",
  // Watched orgs
  "Salesforce",
  "Cisco",
  "Microsoft",
  "Anthropic",
];

export const A_KREBS_SHINY: ArticleFixture = {
  source_id: "krebs",
  source_tier: "primary",
  url: "https://krebsonsecurity.com/2026/04/shinyhunters-claim-cisco-salesforce-data-leak/",
  title: "ShinyHunters Claim Massive Cisco Salesforce Data Leak",
  publishedAt: "2026-04-15T09:30:00Z",
  body: "ShinyHunters published a leak-site post claiming exfiltration of 4 TB of Cisco data via a compromised Salesforce instance. The attack reportedly began with vishing against a Cisco employee. CVE-2026-1234 was referenced as the initial access vector.",
};

export const A_BLEEPING_SHINY_NEAR_DUP: ArticleFixture = {
  source_id: "bleepingcomputer",
  source_tier: "secondary",
  url: "https://www.bleepingcomputer.com/news/security/shinyhunters-claim-cisco-salesforce-data-leak/",
  title: "ShinyHunters claim Cisco Salesforce data leak",
  publishedAt: "2026-04-15T11:42:00Z",
  body: "ShinyHunters claimed responsibility today for a 4 TB exfiltration from Cisco via Salesforce. The vector was reportedly vishing.",
};

export const A_DARKREADING_DIFFERENT_STORY: ArticleFixture = {
  source_id: "darkreading",
  source_tier: "secondary",
  url: "https://www.darkreading.com/threat-intelligence/volt-typhoon-utility-pre-positioning",
  title: "Volt Typhoon Pre-Positioning Continues in US Utility Sector",
  publishedAt: "2026-04-15T14:00:00Z",
  body: "CISA released an advisory on continued Volt Typhoon pre-positioning activity in US electric utilities. CVE-2025-9999 was identified as one of the exploited vulnerabilities.",
};

export const A_VENDOR_MARKETING: ArticleFixture = {
  source_id: "thehackernews",
  source_tier: "aggregator",
  url: "https://thehackernews.com/2026/04/why-zero-trust-is-the-future.html",
  title: "Why Zero Trust Is The Future Of Secure Enterprise Networking",
  publishedAt: "2026-04-15T07:00:00Z",
  body: "In this sponsored post, we examine the modern enterprise network and explain how zero trust principles can help companies modernize their security posture. Cloud adoption continues to accelerate.",
};

export const A_TITLE_CHANGED_LATER: ArticleFixture = {
  source_id: "therecord",
  source_tier: "primary",
  url: "https://therecord.media/shinyhunters-cisco-salesforce-update",
  // Small editorial rewording within hours of A_KREBS_SHINY — the kind of
  // headline tweak we want dedup to absorb. Heavier rewrites (long appended
  // " — UPDATED with statement" suffixes) intentionally fall through to a new
  // article since fuzz.ratio is a poor fit for that case.
  title: "ShinyHunters Claims Massive Cisco Salesforce Leak",
  publishedAt: "2026-04-15T18:00:00Z",
  body: "An update on the ShinyHunters Cisco breach claim with new details and a statement from Cisco.",
};

export const A_OUTSIDE_DEDUP_WINDOW: ArticleFixture = {
  source_id: "darkreading",
  source_tier: "secondary",
  url: "https://www.darkreading.com/2026/02/shinyhunters-claim-cisco-salesforce-data-leak-old/",
  title: "ShinyHunters claim Cisco Salesforce data leak",
  publishedAt: "2026-02-01T09:00:00Z",
  body: "An older, unrelated story with a coincidentally similar title.",
};
