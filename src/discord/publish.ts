// Publish an incident to Discord. First time: POST with ?wait=true, persist
// the returned message id. Subsequent: PATCH the same message so corroboration
// grows in place, per the plan's "no channel spam for multi-source incidents"
// rule.

import type { Client } from "@libsql/client";
import type { DiscordClient } from "../clients/discord.ts";
import type { IncidentRow } from "../turso/incidents.ts";
import { setDiscordMessageId } from "../turso/incidents.ts";
import { composeEmbed, type CorroborationInfo, type EmbedSource } from "./embed.ts";

import type { DiscordPayload } from "../clients/discord.ts";
import { ProviderUnavailable } from "../clients/openai.ts";

export interface PublishInput {
  verified?: DiscordPayload;
  incident: IncidentRow;
  sources: readonly EmbedSource[];
  corroboration: CorroborationInfo;
}

export interface PublishDeps {
  dbClient: Client;
  discord: DiscordClient;
}

export interface PublishResult {
  posted: "new" | "updated";
  messageId: string;
}

export async function publishIncident(input: PublishInput, deps: PublishDeps): Promise<PublishResult> {
  const payload = input.verified ?? composeEmbed(input.incident, input.sources, input.corroboration);

  if (input.incident.discord_message_id) {
    try { await deps.discord.patchMessage(input.incident.discord_message_id, payload); }
    catch (err) { if (input.verified) throw new ProviderUnavailable("Discord edit deferred"); throw err; }
    return { posted: "updated", messageId: input.incident.discord_message_id };
  }

  if (input.verified) {
    const reserved = await deps.dbClient.execute({sql: "INSERT OR IGNORE INTO pending_discord_posts VALUES (?,CURRENT_TIMESTAMP)", args: [input.incident.id]});
    if (!reserved.rowsAffected) throw new ProviderUnavailable("Reconcile pending Discord POST before retry");
  }
  let messageId: string;
  try { ({ messageId } = await deps.discord.postMessage(payload)); }
  catch (err) { if (input.verified) throw new ProviderUnavailable("Reconcile ambiguous Discord POST"); throw err; }
  if (!messageId) throw new ProviderUnavailable("Missing Discord acknowledgement");
  await setDiscordMessageId(deps.dbClient, input.incident.id, messageId);
  return { posted: "new", messageId };
}
