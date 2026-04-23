// One-shot diagnostic: dump articles by stage, with sample failure reasons.
// Invoked via `npm run stats` from a workflow or locally.

import { getClient } from "../src/turso/client.ts";

async function main(): Promise<void> {
  const client = getClient();

  const byStage = await client.execute(`
    SELECT stage_reached, COUNT(*) as n
      FROM articles
     GROUP BY stage_reached
     ORDER BY stage_reached
  `);

  const failureSamples = await client.execute(`
    SELECT stage_reached, failure_reason, COUNT(*) as n
      FROM articles
     WHERE stage_reached IN ('triage_rejected', 'factcheck_failed')
       AND failure_reason IS NOT NULL
     GROUP BY stage_reached, failure_reason
     ORDER BY n DESC
     LIMIT 30
  `);

  const incidentCount = await client.execute(`SELECT COUNT(*) as n FROM incidents`);
  const publishedIncidentCount = await client.execute(
    `SELECT COUNT(*) as n FROM incidents WHERE discord_message_id IS NOT NULL`,
  );

  console.log(
    JSON.stringify(
      {
        by_stage: byStage.rows.map((r) => ({ stage: String(r.stage_reached), n: Number(r.n) })),
        top_failure_reasons: failureSamples.rows.map((r) => ({
          stage: String(r.stage_reached),
          reason: String(r.failure_reason),
          n: Number(r.n),
        })),
        incidents: Number(incidentCount.rows[0]!.n),
        incidents_posted_to_discord: Number(publishedIncidentCount.rows[0]!.n),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(JSON.stringify({ stats: "fatal", error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
