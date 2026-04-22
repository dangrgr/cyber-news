// Deterministic pre-filter per PRD §8.3.
//
//   Score = 1.0 * (cve_count > 0)
//         + 1.5 * known_entity_hits
//         + 0.5 * keyword_hits
//         + 0.3 * (source_tier === 'primary')
//
//   Score < 1.0  → stage_reached = 'pre_filtered', skip LLM entirely
//   Score ≥ 1.0  → proceed to triage
//
// "Kills 60–80% of articles before spending a token." Scoring weights live here
// — any future tuning against logged results should change them in one place.

export const SCORE_THRESHOLD = 1.0;

export const WEIGHTS = {
  cvePresent: 1.0,
  perEntityHit: 1.5,
  perKeywordHit: 0.5,
  primarySource: 0.3,
} as const;

// PRD §8.3 example list. Add cautiously — every keyword broadens the LLM funnel.
export const HIGH_SIGNAL_KEYWORDS: readonly string[] = [
  "ransomware",
  "breach",
  "breached",
  "exfiltrated",
  "exfiltration",
  "zero-day",
  "0-day",
  "zeroday",
  "cve",
  "apt",
  "wiper",
  "supply chain",
  "data leak",
  "leak site",
  "extortion",
  "advisory",
  "patch",
  "exploit",
  "exploited",
  "vulnerability",
  "compromise",
  "compromised",
  "intrusion",
];

const CVE_REGEX = /\bCVE-\d{4}-\d{4,7}\b/gi;

export interface PrefilterInput {
  title: string;
  body: string;
  sourceTier: "primary" | "secondary" | "aggregator" | "vendor" | "advisory";
  /** Canonical entity-alias strings to substring-match (case-insensitive). */
  entityAliases: readonly string[];
}

export interface PrefilterResult {
  score: number;
  passed: boolean;
  cves: string[];
  entityHits: string[];   // canonical alias strings as supplied
  keywordHits: string[];
  reason: string;
}

function uniqueCveIds(text: string): string[] {
  const matches = text.match(CVE_REGEX);
  if (!matches) return [];
  const seen = new Set<string>();
  for (const m of matches) seen.add(m.toUpperCase());
  return [...seen];
}

function findEntityHits(haystack: string, aliases: readonly string[]): string[] {
  // Word-boundary substring match. Aliases like "APT28" are short, so a naive
  // includes() would over-match on tokens like "rapt28". \b on either side keeps
  // it tight without a regex per alias.
  const lower = haystack.toLowerCase();
  const hits: string[] = [];
  const seen = new Set<string>();
  for (const alias of aliases) {
    const trimmed = alias.trim();
    if (trimmed.length === 0) continue;
    const lowerAlias = trimmed.toLowerCase();
    if (seen.has(lowerAlias)) continue;
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(lowerAlias)}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) {
      hits.push(trimmed);
      seen.add(lowerAlias);
    }
  }
  return hits;
}

function findKeywordHits(haystack: string): string[] {
  const lower = haystack.toLowerCase();
  const hits: string[] = [];
  for (const kw of HIGH_SIGNAL_KEYWORDS) {
    if (lower.includes(kw)) hits.push(kw);
  }
  return hits;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function scorePrefilter(input: PrefilterInput): PrefilterResult {
  const text = `${input.title}\n${input.body}`;
  const cves = uniqueCveIds(text);
  const entityHits = findEntityHits(text, input.entityAliases);
  const keywordHits = findKeywordHits(text);

  const score =
    (cves.length > 0 ? WEIGHTS.cvePresent : 0) +
    WEIGHTS.perEntityHit * entityHits.length +
    WEIGHTS.perKeywordHit * keywordHits.length +
    (input.sourceTier === "primary" ? WEIGHTS.primarySource : 0);

  const reasonParts: string[] = [];
  if (cves.length > 0) reasonParts.push(`cves=${cves.length}`);
  if (entityHits.length > 0) reasonParts.push(`entities=${entityHits.length}`);
  if (keywordHits.length > 0) reasonParts.push(`keywords=${keywordHits.length}`);
  if (input.sourceTier === "primary") reasonParts.push("primary_source");

  return {
    score: Math.round(score * 100) / 100,
    passed: score >= SCORE_THRESHOLD,
    cves,
    entityHits,
    keywordHits,
    reason: reasonParts.length > 0 ? reasonParts.join(",") : "no_signal",
  };
}
