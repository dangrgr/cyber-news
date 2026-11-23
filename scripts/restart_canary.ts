// Replay one previously accepted story in an empty, disposable database.
// No production write handle or Discord credential is used by this Job.
import { createClient } from "@libsql/client";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "./migrate.ts";
import { insertArticle } from "../src/turso/articles.ts";
import { spawnSync } from "node:child_process";

if (process.env.DRY_RUN !== "1" || process.env.TURSO_DATABASE_URL !== "file:/tmp/canary.db" || process.env.DISCORD_WEBHOOK_NEWS)
  throw new Error("Canary requires a disposable DB, dry-run, and no webhook");
const original = new DatabaseSync("/history/cyber-news.db", {readOnly:true});
const row = original.prepare(`SELECT a.* FROM articles a JOIN incidents i ON a.incident_id=i.id
  WHERE a.stage_reached='published' AND i.discord_message_id IS NOT NULL
  AND length(a.raw_text) BETWEEN 1200 AND 9000 AND i.confidence='confirmed'
  ORDER BY a.published_at DESC LIMIT 1`).get();
original.close();
if (!row) throw new Error("No representative historical fixture");
const db = createClient({url:process.env.TURSO_DATABASE_URL});
await runMigrations(db);
await insertArticle(db, {id:String(row.id),sourceId:String(row.source_id),url:String(row.url),
  canonicalUrl:String(row.canonical_url),title:String(row.title),author:null,
  publishedAt:String(row.published_at),rawText:String(row.raw_text),stage:"deduped"});
db.close();
console.log(JSON.stringify({canary_source:row.url, published_at:row.published_at}));
const run = spawnSync(process.execPath, ["--import","tsx/esm","src/pipeline/run_process.ts"], {
  env:{...process.env, DISCORD_WEBHOOK_NEWS:"https://invalid.invalid/canary"},stdio:"inherit"});
if (run.status !== 0) process.exit(run.status ?? 1);
const result = new DatabaseSync("/tmp/canary.db", {readOnly:true});
if (!result.prepare("SELECT 1 FROM incidents WHERE discord_message_id='dry-run-noop'").get())
  throw new Error("Canary did not reach the verified Discord preview");
