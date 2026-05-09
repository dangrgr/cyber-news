// Discord webhook client. POSTs a new message (first publish) or PATCHes an
// existing one (subsequent corroboration updates). The webhook URL includes
// the token; `?wait=true` on POST returns the message object so we can persist
// `discord_message_id`.
//
// DRY_RUN=1 short-circuits every outbound HTTP call (post + patch). The
// chokepoint is here, not at higher-level publishers, so a single env var flip
// is sufficient to guarantee no network egress.

import { createHash } from "node:crypto";

import type { RunLogger } from "../util/run_log.ts";

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  footer?: { text: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export interface DiscordPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordClient {
  postMessage(payload: DiscordPayload): Promise<{ messageId: string }>;
  patchMessage(messageId: string, payload: DiscordPayload): Promise<void>;
}

export interface DiscordClientOptions {
  webhookUrl: string;
  fetch?: typeof globalThis.fetch;
  /** Max retries on 5xx or network failure. Default 1. */
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
  /** Optional run logger. When provided, every send is recorded as a
   *  `discord_payload` event with `dry_run` and `payload_digest`. */
  runLog?: RunLogger;
  /** Override DRY_RUN env source (tests). */
  env?: NodeJS.ProcessEnv;
}

const DRY_RUN_MESSAGE_ID = "dry-run-noop";

export function createDiscordClient(options: DiscordClientOptions): DiscordClient {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const maxRetries = options.maxRetries ?? 1;
  const sleep = options.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  const env = options.env ?? process.env;

  const postUrl = options.webhookUrl + (options.webhookUrl.includes("?") ? "&" : "?") + "wait=true";

  async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (err) {
        if (attempt >= maxRetries) throw err;
        attempt++;
        await sleep(500 * attempt);
      }
    }
  }

  function recordSend(method: "post" | "patch", payload: DiscordPayload, dryRun: boolean, messageId?: string): void {
    if (!options.runLog) return;
    const digest = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
    options.runLog.logEvent({
      event: "discord_payload",
      method,
      dry_run: dryRun,
      payload_digest: digest,
      payload,
      ...(messageId ? { message_id: messageId } : {}),
    });
  }

  return {
    async postMessage(payload) {
      const dryRun = env.DRY_RUN === "1";
      recordSend("post", payload, dryRun);
      // DRY_RUN check sits outside withRetry: there's no point retrying a no-op.
      if (dryRun) return { messageId: DRY_RUN_MESSAGE_ID };
      return withRetry("post", async () => {
        const res = await fetchFn(postUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`discord POST failed: ${res.status} ${res.statusText}`);
        const body = (await res.json()) as { id: string };
        return { messageId: body.id };
      });
    },
    async patchMessage(messageId, payload) {
      const dryRun = env.DRY_RUN === "1";
      recordSend("patch", payload, dryRun, messageId);
      if (dryRun) return;
      const patchUrl = options.webhookUrl + `/messages/${encodeURIComponent(messageId)}`;
      await withRetry("patch", async () => {
        const res = await fetchFn(patchUrl, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`discord PATCH failed: ${res.status} ${res.statusText}`);
      });
    },
  };
}
