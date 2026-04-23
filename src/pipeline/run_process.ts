// CLI entry point for `npm run process`. Instantiates real clients from env
// and delegates to processPendingArticles. Test files import processPendingArticles
// directly and inject fakes — this entry point is only ever invoked by a
// cron-triggered GH Actions step.

import { getClient } from "../turso/client.ts";
import { createAnthropicClient } from "../clients/anthropic.ts";
import { createDiscordClient } from "../clients/discord.ts";
import { createBraveClient } from "../clients/brave.ts";
import { createNvdClient } from "../clients/nvd.ts";
import { processPendingArticles } from "./process.ts";

async function main(): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_NEWS;
  if (!webhook) {
    throw new Error("DISCORD_WEBHOOK_NEWS env var is required");
  }

  const db = getClient();
  const anthropic = createAnthropicClient();
  const discord = createDiscordClient({ webhookUrl: webhook });
  const brave = createBraveClient();
  const nvd = createNvdClient();

  const summary = await processPendingArticles({
    db,
    anthropic,
    discord,
    brave,
    cveCache: { client: db, nvd },
  });

  console.log(JSON.stringify({ process: "complete", ...summary }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(
      JSON.stringify({ process: "fatal", error: err instanceof Error ? err.message : String(err) }),
    );
    process.exit(1);
  });
}
