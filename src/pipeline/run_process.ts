// CLI entry point for `npm run process`. Instantiates real clients from env
// and delegates to processPendingArticles. Test files import processPendingArticles
// directly and inject fakes — this entry point is only ever invoked by a
// cron-triggered GH Actions step.

import { getClient, initializeDatabase } from "../turso/client.ts";
import { createAnthropicClient } from "../clients/anthropic.ts";
import { createDiscordClient } from "../clients/discord.ts";
import { createBraveClient } from "../clients/brave.ts";
import { createNvdClient } from "../clients/nvd.ts";
import { processPendingArticles } from "./process.ts";
import { startRun } from "../util/run_log.ts";

async function main(): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_NEWS;
  if (!webhook) {
    throw new Error("DISCORD_WEBHOOK_NEWS env var is required");
  }

  const log = startRun("process");

  const db = getClient();
  await initializeDatabase(db);
  const anthropic = createAnthropicClient();
  const discord = createDiscordClient({ webhookUrl: webhook, runLog: log });
  const brave = createBraveClient();
  const nvd = createNvdClient();

  // try/finally: a crash mid-pipeline must still flush partial NDJSON +
  // append an INDEX row so the failure is visible to the read-only agent.
  try {
    const summary = await processPendingArticles({
      db,
      anthropic,
      discord,
      brave,
      cveCache: { client: db, nvd },
      runLog: log,
    });

    await log.finishRun(summary as unknown as Record<string, unknown>);
    console.log(JSON.stringify({ process: "complete", ...summary }));
  } catch (err) {
    await log.finishRun({ error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(
      JSON.stringify({ process: "fatal", error: err instanceof Error ? err.message : String(err) }),
    );
    process.exit(1);
  });
}
