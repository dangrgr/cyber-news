// Pure Discord embed composer. Takes an incident row plus corroboration info
// and returns the webhook payload. No I/O — the caller publishes.
//
// Format matches PRD §11.1: title with confidence dot, details as a
// newline-separated description block, footer carries incident_id for the
// future investigation dispatch.

import type { IncidentRow } from "../turso/incidents.ts";
import type { DiscordPayload } from "../clients/discord.ts";
import type { Confidence } from "../patterns/types.ts";

export interface EmbedSource {
  name: string;
  url: string;
}

export interface CorroborationInfo {
  tier1: number;
  tier2: number;
}

const CONFIDENCE_DOT: Record<Confidence, string> = {
  confirmed: "🟢",
  reported: "🟡",
  claim: "🔴",
};

const CONFIDENCE_COLOR: Record<Confidence, number> = {
  confirmed: 0x2ecc71, // green
  reported: 0xf1c40f, // yellow
  claim: 0xe74c3c, // red
};

export function composeEmbed(
  incident: IncidentRow,
  sources: readonly EmbedSource[],
  corroboration: CorroborationInfo,
): DiscordPayload {
  const confDot = CONFIDENCE_DOT[incident.confidence];
  const title = `${confDot} ${incident.title}`;

  const actorLine = formatActorLine(incident);
  const sourcesLine = formatSourcesLine(sources, corroboration);
  const technicalLine = formatTechnicalLine(incident);
  const dateLine = formatDateLine(incident);
  const readSource = sources[0]?.url ?? incident.source_urls[0];

  const descriptionLines = [
    actorLine,
    incident.summary,
    sourcesLine,
    technicalLine,
    dateLine,
    readSource ? `[Read source](${readSource})` : null,
  ].filter((line): line is string => line !== null && line.length > 0);

  return {
    embeds: [
      {
        title,
        description: descriptionLines.join("\n"),
        url: readSource,
        color: CONFIDENCE_COLOR[incident.confidence],
        footer: { text: `incident_id=${incident.id}` },
      },
    ],
  };
}

function formatActorLine(incident: IncidentRow): string {
  if (incident.threat_actors_attributed.length === 0) return "";
  return `**Actor:** ${incident.threat_actors_attributed.join(", ")}`;
}

function formatSourcesLine(
  sources: readonly EmbedSource[],
  corroboration: CorroborationInfo,
): string {
  const names = sources.map((s) => s.name);
  const totalDistinct = new Set([
    ...names,
    ...Array.from({ length: corroboration.tier1 }, (_, i) => `__t1_${i}`),
    ...Array.from({ length: corroboration.tier2 }, (_, i) => `__t2_${i}`),
  ]).size;
  const dot = totalDistinct >= 3 ? "🟢" : totalDistinct === 2 ? "🟡" : "🔴";
  const nameList = names.join(", ");
  return `**Sources:** ${nameList} • ${dot} ${totalDistinct} corroborating`;
}

function formatTechnicalLine(incident: IncidentRow): string {
  const cves = incident.cves.length > 0 ? incident.cves.join(", ") : "none";
  const access = incident.initial_access_vector ?? "n/a";
  return `**CVEs:** ${cves} • **Access:** ${access}`;
}

function formatDateLine(incident: IncidentRow): string {
  const date = incident.incident_date ?? "unknown";
  return `**Incident date:** ${date} • **Confidence:** ${incident.confidence}`;
}
