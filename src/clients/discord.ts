// Discord webhook client. POSTs a new message (first publish) or PATCHes an
// existing one (subsequent corroboration updates). The webhook URL includes
// the token; `?wait=true` on POST returns the message object so we can persist
// `discord_message_id`.

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
}

export function createDiscordClient(options: DiscordClientOptions): DiscordClient {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const maxRetries = options.maxRetries ?? 1;
  const sleep = options.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));

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

  return {
    async postMessage(payload) {
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
