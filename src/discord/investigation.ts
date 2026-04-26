// Thread-aware Discord publisher for Phase 3 investigations.
//
// Channel assumption: the DISCORD_WEBHOOK_INVESTIGATIONS webhook points at a
// forum channel. On the first POST, thread_name creates a new thread whose
// id we get back in the response. Subsequent posts to the same thread use
// ?thread_id=<id> against the same webhook URL.
//
// For text channels (no forum), thread_name is silently ignored by Discord
// and posts land in the channel directly. In that case we don't have a
// thread id and follow-ups post to the channel — visually ugly but functional.

import type { InvestigationResult } from "../investigate/types.ts";
import type { IncidentRow } from "../turso/incidents.ts";

export interface InvestigationPostDeps {
  webhookUrl: string;
  fetch?: typeof globalThis.fetch;
}

export interface StartThreadResult {
  threadId: string | null;
  parentMessageId: string;
}

export async function postInvestigationStart(
  incident: IncidentRow,
  deps: InvestigationPostDeps,
): Promise<StartThreadResult> {
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const startedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const body = {
    thread_name: truncate(`\u{1F50D} Investigation: ${incident.title}`, 100),
    content: [
      `\u{1F50D} **Investigation: ${escapeMd(incident.title)}**`,
      `Status: In progress • Started ${startedAt}`,
      `Running: Sonnet agent with web search + custom tools`,
      `Incident: \`${incident.id}\``,
    ].join("\n"),
  };

  const url = appendQuery(deps.webhookUrl, "wait=true");
  const res = await fetchFn(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`discord start-thread failed: ${res.status} ${res.statusText}`);
  }
  const payload = (await res.json()) as { id: string; channel_id?: string };
  // Forum channels return channel_id = new thread id; text channels return
  // the same channel id the webhook targets, which we can't distinguish
  // without an extra API call. Trust it when present.
  const threadId = payload.channel_id ?? null;
  return { threadId, parentMessageId: payload.id };
}

export interface PostResultInput {
  threadId: string | null;
  incident: IncidentRow;
  result: InvestigationResult;
}

export async function postInvestigationResult(
  input: PostResultInput,
  deps: InvestigationPostDeps,
): Promise<void> {
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const url = threadedUrl(deps.webhookUrl, input.threadId);

  const summary = extractSummarySection(input.result.markdown);
  const content = [
    `**Summary** — _confidence: ${input.result.confidence_overall}, sources: ${input.result.sources_fetched}, cost: $${input.result.cost_usd.toFixed(2)}, terminated: ${input.result.terminated_reason}_`,
    "",
    truncate(summary, 1600),
    "",
    "_Full report and evidence attached below._",
  ].join("\n");

  const form = new FormData();
  form.set(
    "payload_json",
    JSON.stringify({
      content: truncate(content, 1990),
      attachments: [
        { id: 0, filename: `${input.incident.id}.md` },
        { id: 1, filename: `${input.incident.id}-evidence.json` },
      ],
    }),
  );
  form.set(
    "files[0]",
    new Blob([input.result.markdown], { type: "text/markdown" }),
    `${input.incident.id}.md`,
  );
  form.set(
    "files[1]",
    new Blob([JSON.stringify(input.result.evidence, null, 2)], { type: "application/json" }),
    `${input.incident.id}-evidence.json`,
  );

  const res = await fetchFn(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`discord post-result failed: ${res.status} ${res.statusText} ${text}`);
  }
}

export async function postInvestigationFailed(
  threadId: string | null,
  incident: IncidentRow,
  error: string,
  deps: InvestigationPostDeps,
): Promise<void> {
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const url = threadedUrl(deps.webhookUrl, threadId);
  const body = {
    content: `⚠️ **Investigation failed for \`${incident.id}\`**\n\`\`\`\n${truncate(error, 1800)}\n\`\`\``,
  };
  const res = await fetchFn(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`discord post-failed failed: ${res.status} ${res.statusText}`);
  }
}

// ----- helpers -----

function threadedUrl(webhookUrl: string, threadId: string | null): string {
  return threadId ? appendQuery(webhookUrl, `thread_id=${encodeURIComponent(threadId)}`) : webhookUrl;
}

function appendQuery(url: string, param: string): string {
  return url + (url.includes("?") ? "&" : "?") + param;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function escapeMd(s: string): string {
  return s.replace(/([*_`|])/g, "\\$1");
}

/** Extract the "## Summary" section body (3–4 sentences per PRD §10.4). */
export function extractSummarySection(markdown: string): string {
  const summaryIdx = markdown.search(/^##+\s+Summary\s*$/m);
  if (summaryIdx < 0) return markdown.trim().slice(0, 400);
  const rest = markdown.slice(summaryIdx).replace(/^##+\s+Summary\s*$/m, "").trimStart();
  const nextSection = rest.search(/^##+\s/m);
  return (nextSection >= 0 ? rest.slice(0, nextSection) : rest).trim();
}
