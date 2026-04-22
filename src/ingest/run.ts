// Phase 1 entry point. Run by `npm run ingest` and by .github/workflows/ingest.yml.
//
// Lifecycle:
//   for each source:
//     fetch RSS
//     for each entry:
//       canonicalize URL
//       dedup against last 30d of articles
//         if duplicate → skip (PRD: dedup is the wall, no INSERT)
//       extract body via Readability (fallback to RSS snippet)
//       run pre-filter
//       INSERT with stage_reached = 'deduped' (passed) or 'pre_filtered' (skipped)
//
// No LLM stages run in Phase 1.

import { SOURCES } from "./sources.ts";
import { fetchFeed, extractArticleBody } from "./fetcher.ts";
import { canonicalizeUrl, articleId } from "./canonicalize.ts";
import { findDuplicate } from "./dedup.ts";
import { scorePrefilter } from "../pipeline/prefilter.ts";
import { getClient } from "../turso/client.ts";
import {
  insertArticle,
  recentArticlesForDedup,
  loadAllAliases,
  loadAliasesIntoTable,
} from "../turso/articles.ts";
import { loadEntities, flattenAliases } from "../entities/load.ts";

const DEDUP_LOOKBACK_DAYS = 30;

interface RunStats {
  source_id: string;
  fetched: number;
  duplicates: number;
  pre_filtered: number;
  passed_to_triage: number;
  errors: Array<{ url: string; stage_reached: string; reason: string }>;
}

async function refreshEntityAliasCache(): Promise<string[]> {
  const client = getClient();
  const file = await loadEntities("entities.yaml");
  const rows = flattenAliases(file);
  await loadAliasesIntoTable(client, rows);
  return loadAllAliases(client);
}

async function processSource(
  sourceIndex: number,
  aliases: readonly string[],
): Promise<RunStats> {
  const source = SOURCES[sourceIndex]!;
  const client = getClient();
  const stats: RunStats = {
    source_id: source.id,
    fetched: 0,
    duplicates: 0,
    pre_filtered: 0,
    passed_to_triage: 0,
    errors: [],
  };

  let entries;
  try {
    entries = await fetchFeed(source);
  } catch (err) {
    // Errors are logged with stage_reached per CLAUDE.md style; never silently swallowed.
    stats.errors.push({
      url: source.url,
      stage_reached: "ingest_failed",
      reason: err instanceof Error ? err.message : String(err),
    });
    return stats;
  }
  stats.fetched = entries.length;

  const recent = await recentArticlesForDedup(client, DEDUP_LOOKBACK_DAYS);

  for (const entry of entries) {
    try {
      const canonical = canonicalizeUrl(entry.link);
      const id = articleId(canonical);

      const dup = findDuplicate(
        { id, canonicalUrl: canonical, title: entry.title, publishedAt: entry.publishedAt },
        recent,
      );
      if (dup.isDuplicate) {
        stats.duplicates++;
        continue;
      }

      const body = (await extractArticleBody(entry.link)) ?? entry.rawText;
      const pre = scorePrefilter({
        title: entry.title,
        body,
        sourceTier: source.tier,
        entityAliases: aliases,
      });

      const stage = pre.passed ? "deduped" : "pre_filtered";
      const failureReason = pre.passed ? null : `prefilter_score=${pre.score} ${pre.reason}`;

      await insertArticle(client, {
        id,
        sourceId: source.id,
        url: entry.link,
        canonicalUrl: canonical,
        title: entry.title,
        author: entry.author,
        publishedAt: entry.publishedAt,
        rawText: body,
        stage,
        failureReason,
      });

      // Insert into the in-memory recent set so subsequent entries in the same run dedup against it.
      recent.push({
        id,
        canonicalUrl: canonical,
        title: entry.title,
        publishedAt: entry.publishedAt,
        incidentId: null,
      });

      if (pre.passed) stats.passed_to_triage++;
      else stats.pre_filtered++;
    } catch (err) {
      stats.errors.push({
        url: entry.link,
        stage_reached: "ingest_failed",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return stats;
}

export async function runIngest(): Promise<RunStats[]> {
  const aliases = await refreshEntityAliasCache();
  const all: RunStats[] = [];
  for (let i = 0; i < SOURCES.length; i++) {
    all.push(await processSource(i, aliases));
  }
  return all;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  runIngest()
    .then((stats) => {
      const summary = stats.reduce(
        (acc, s) => {
          acc.fetched += s.fetched;
          acc.duplicates += s.duplicates;
          acc.pre_filtered += s.pre_filtered;
          acc.passed_to_triage += s.passed_to_triage;
          acc.error_count += s.errors.length;
          return acc;
        },
        { fetched: 0, duplicates: 0, pre_filtered: 0, passed_to_triage: 0, error_count: 0 },
      );
      console.log(JSON.stringify({ run: "ingest", per_source: stats, totals: summary }, null, 2));
    })
    .catch((err) => {
      console.error(JSON.stringify({ run: "ingest", fatal: err instanceof Error ? err.message : String(err) }));
      process.exit(1);
    });
}
