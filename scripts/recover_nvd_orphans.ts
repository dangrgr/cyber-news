// One-off recovery for articles stamped factcheck_failed by the pre-fix NVD
// 429 bug. Narrowly scoped: only touches rows whose failure_reason matches
// the exact prefix 'unhandled:NVD lookup failed' AND contains '429 Too Many'.
// Resets them to stage_reached='deduped' so the next process run re-attempts
// them (with the fixed NVD client that gracefully degrades on rate limits).
//
// Idempotent. Runs in DRY_RUN mode by default; set APPLY=1 to actually write.

import { getClient } from "../src/turso/client.ts";

const SELECT_ORPHANS = `
  SELECT id, title, failure_reason
    FROM articles
   WHERE stage_reached = 'factcheck_failed'
     AND failure_reason LIKE 'unhandled:NVD lookup failed%429 Too Many%'
`;

const UPDATE_ORPHANS = `
  UPDATE articles
     SET stage_reached = 'deduped',
         failure_reason = NULL
   WHERE stage_reached = 'factcheck_failed'
     AND failure_reason LIKE 'unhandled:NVD lookup failed%429 Too Many%'
`;

async function main(): Promise<void> {
  const client = getClient();
  const apply = process.env.APPLY === "1";

  const found = await client.execute(SELECT_ORPHANS);
  const rows = found.rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    failure_reason: String(r.failure_reason),
  }));

  console.log(
    JSON.stringify(
      {
        recover: apply ? "applying" : "dry_run",
        matched: rows.length,
        rows,
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log(JSON.stringify({ recover: "dry_run_complete", hint: "Set APPLY=1 to write changes" }));
    return;
  }

  const res = await client.execute(UPDATE_ORPHANS);
  console.log(JSON.stringify({ recover: "applied", rows_affected: res.rowsAffected }));
}

main().catch((err) => {
  console.error(JSON.stringify({ recover: "fatal", error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
