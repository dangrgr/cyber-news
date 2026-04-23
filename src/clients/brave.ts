// Brave Search API client. Used only for the display-only corroboration
// indicator in Discord embeds — NOT a publish gate. Graceful degradation:
// missing API key, rate limit, or error all return zero counts so publish
// still proceeds.

export interface BraveResult {
  url: string;
  title: string;
  hostname: string;
}

export interface BraveClient {
  search(query: string): Promise<BraveResult[]>;
}

export interface BraveClientOptions {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  endpoint?: string;
  /** Max results per query. Default 20. */
  count?: number;
}

const DEFAULT_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";

export function createBraveClient(options: BraveClientOptions = {}): BraveClient {
  const apiKey = options.apiKey ?? process.env.BRAVE_API_KEY;
  const fetchFn = options.fetch ?? globalThis.fetch;
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const count = options.count ?? 20;

  return {
    async search(query: string): Promise<BraveResult[]> {
      if (!apiKey) return []; // graceful degrade — see file header
      try {
        const url = `${endpoint}?q=${encodeURIComponent(query)}&count=${count}`;
        const res = await fetchFn(url, {
          headers: { "x-subscription-token": apiKey, accept: "application/json" },
        });
        if (!res.ok) return [];
        const body = (await res.json()) as BraveResponse;
        const results = body.web?.results ?? [];
        return results.map((r) => ({
          url: r.url,
          title: r.title ?? "",
          hostname: safeHost(r.url),
        }));
      } catch {
        return [];
      }
    },
  };
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

interface BraveResponse {
  web?: {
    results?: Array<{ url: string; title?: string }>;
  };
}

/**
 * Count trusted-source matches by tier. Hosts are matched by exact hostname
 * equality against the `tier_1` / `tier_2` lists from entities.yaml. Subdomain
 * matching is intentional: `www.krebsonsecurity.com` counts for `krebsonsecurity.com`.
 */
export function countByTier(
  results: BraveResult[],
  tier1: readonly string[],
  tier2: readonly string[],
): { tier1: number; tier2: number } {
  const t1 = new Set(tier1.map((h) => h.toLowerCase()));
  const t2 = new Set(tier2.map((h) => h.toLowerCase()));
  let c1 = 0;
  let c2 = 0;
  const seenHosts = new Set<string>(); // count each distinct host at most once
  for (const r of results) {
    const host = r.hostname;
    if (!host || seenHosts.has(host)) continue;
    seenHosts.add(host);
    if (matchesAny(host, t1)) c1++;
    else if (matchesAny(host, t2)) c2++;
  }
  return { tier1: c1, tier2: c2 };
}

function matchesAny(host: string, set: Set<string>): boolean {
  if (set.has(host)) return true;
  for (const base of set) {
    if (host === base || host.endsWith(`.${base}`)) return true;
  }
  return false;
}
