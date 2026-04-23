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
