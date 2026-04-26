// Articles repository — the Phase 1 surface.
// `stage_reached` semantics per PRD §6: never deleted, lifecycle marker per article.

import type { Client } from "@libsql/client";
import type { ExistingArticle } from "../ingest/dedup.ts";

export type Stage =
  | "deduped"
  | "pre_filtered"
  | "triage_rejected"
  | "extracted"
  | "factcheck_failed"
  | "published";

export interface ArticleRow {
  id: string;
  source_id: string;
  url: string;
  canonical_url: string;
  title: string;
  author: string | null;
  published_at: string;
  ingested_at: string;
  raw_text: string;
  stage_reached: Stage;
  failure_reason: string | null;
  incident_id: string | null;
}

export interface InsertArticle {
  id: string;
  sourceId: string;
  url: string;
  canonicalUrl: string;
  title: string;
  author: string | null;
  publishedAt: string;
  rawText: string;
  stage: Stage;
  failureReason?: string | null;
  incidentId?: string | null;
}

const INSERT_SQL = `
  INSERT INTO articles
    (id, source_id, url, canonical_url, title, author, published_at, ingested_at,
     raw_text, stage_reached, failure_reason, incident_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO NOTHING
`;

export async function insertArticle(client: Client, a: InsertArticle): Promise<boolean> {
  const res = await client.execute({
    sql: INSERT_SQL,
    args: [
      a.id,
      a.sourceId,
      a.url,
      a.canonicalUrl,
      a.title,
      a.author,
      a.publishedAt,
      new Date().toISOString(),
      a.rawText,
      a.stage,
      a.failureReason ?? null,
      a.incidentId ?? null,
    ],
  });
  return res.rowsAffected > 0;
}

export async function articleExists(client: Client, id: string): Promise<boolean> {
  const res = await client.execute({ sql: `SELECT 1 FROM articles WHERE id = ? LIMIT 1`, args: [id] });
  return res.rows.length > 0;
}

/**
 * Recent articles for the dedup window. Pulled into memory because the corpus
 * is small (a few thousand rows tops at personal volume) and the title-fuzzy-match
 * step is RAM-only.
 */
export async function recentArticlesForDedup(
  client: Client,
  windowDays: number,
): Promise<ExistingArticle[]> {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const res = await client.execute({
    sql: `
      SELECT id, canonical_url, title, published_at, incident_id
      FROM articles
      WHERE published_at >= ?
      ORDER BY published_at DESC
    `,
    args: [cutoff],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    canonicalUrl: String(r.canonical_url),
    title: String(r.title),
    publishedAt: String(r.published_at),
    incidentId: r.incident_id == null ? null : String(r.incident_id),
  }));
}

export async function attachIncident(
  client: Client,
  articleId: string,
  incidentId: string,
): Promise<void> {
  await client.execute({
    sql: `UPDATE articles SET incident_id = ? WHERE id = ?`,
    args: [incidentId, articleId],
  });
}

/**
 * Articles currently at a given stage, ordered oldest-published first so the
 * Phase 2 processor handles backlog in arrival order. Limited because a single
 * run can't realistically process more than ~50 articles within the GH Actions
 * 15-minute budget (see PRD §13 and the MAX_PROCESS_BATCH env default).
 */
export async function queryByStage(client: Client, stage: Stage, limit: number): Promise<ArticleRow[]> {
  const res = await client.execute({
    sql: `SELECT id, source_id, url, canonical_url, title, author, published_at,
                 ingested_at, raw_text, stage_reached, failure_reason, incident_id
            FROM articles
           WHERE stage_reached = ?
        ORDER BY published_at ASC
           LIMIT ?`,
    args: [stage, limit],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    source_id: String(r.source_id),
    url: String(r.url),
    canonical_url: String(r.canonical_url),
    title: String(r.title),
    author: r.author == null ? null : String(r.author),
    published_at: String(r.published_at),
    ingested_at: String(r.ingested_at),
    raw_text: String(r.raw_text),
    stage_reached: String(r.stage_reached) as Stage,
    failure_reason: r.failure_reason == null ? null : String(r.failure_reason),
    incident_id: r.incident_id == null ? null : String(r.incident_id),
  }));
}

/**
 * All articles tied to a given incident, oldest-published first. Phase 3 takes
 * `[0]` as "source zero" — the triggering article whose extraction produced
 * the incident row. Later indices are corroborating articles picked up by
 * dedup. Returns [] if the incident has no articles (shouldn't happen in
 * practice; published incidents always have at least one).
 */
export async function getArticlesByIncidentId(
  client: Client,
  incidentId: string,
): Promise<ArticleRow[]> {
  const res = await client.execute({
    sql: `SELECT id, source_id, url, canonical_url, title, author, published_at,
                 ingested_at, raw_text, stage_reached, failure_reason, incident_id
            FROM articles
           WHERE incident_id = ?
        ORDER BY published_at ASC`,
    args: [incidentId],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    source_id: String(r.source_id),
    url: String(r.url),
    canonical_url: String(r.canonical_url),
    title: String(r.title),
    author: r.author == null ? null : String(r.author),
    published_at: String(r.published_at),
    ingested_at: String(r.ingested_at),
    raw_text: String(r.raw_text),
    stage_reached: String(r.stage_reached) as Stage,
    failure_reason: r.failure_reason == null ? null : String(r.failure_reason),
    incident_id: r.incident_id == null ? null : String(r.incident_id),
  }));
}

export async function setStage(
  client: Client,
  articleId: string,
  stage: Stage,
  failureReason: string | null = null,
): Promise<void> {
  await client.execute({
    sql: `UPDATE articles SET stage_reached = ?, failure_reason = ? WHERE id = ?`,
    args: [stage, failureReason, articleId],
  });
}

export async function loadAliasesIntoTable(
  client: Client,
  rows: ReadonlyArray<{ alias: string; canonical: string; entity_type: string; confidence: number }>,
): Promise<void> {
  // Re-seed cleanly — entity YAML is the source of truth, table is a cache.
  await client.execute(`DELETE FROM entity_aliases`);
  for (const r of rows) {
    await client.execute({
      sql: `INSERT INTO entity_aliases (alias, canonical, entity_type, confidence)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(alias, entity_type) DO UPDATE SET canonical = excluded.canonical`,
      args: [r.alias, r.canonical, r.entity_type, r.confidence],
    });
  }
}

export async function loadAllAliases(client: Client): Promise<string[]> {
  const res = await client.execute(`SELECT alias FROM entity_aliases`);
  return res.rows.map((r) => String(r.alias));
}
