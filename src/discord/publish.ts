// Publish an incident to Discord. First time: POST with ?wait=true, persist
// the returned message id. Subsequent: PATCH the same message so corroboration
// grows in place, per the plan's "no channel spam for multi-source incidents"
// rule.

import type { Client } from "@libsql/client";
import type { DiscordClient } from "../clients/discord.ts";
import type { IncidentRow } from "../turso/incidents.ts";
import { setDiscordMessageId } from "../turso/incidents.ts";
import { composeEmbed, type CorroborationInfo, type EmbedSource } from "./embed.ts";

export interface PublishInput {
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
  const payload = composeEmbed(input.incident, input.sources, input.corroboration);

  if (input.incident.discord_message_id) {
    await deps.discord.patchMessage(input.incident.discord_message_id, payload);
    return { posted: "updated", messageId: input.incident.discord_message_id };
  }

  const { messageId } = await deps.discord.postMessage(payload);
  await setDiscordMessageId(deps.dbClient, input.incident.id, messageId);
  return { posted: "new", messageId };
}
