// NVD 2.0 CVE lookup. Used only for existence check in Phase 2 factcheck;
// the richer fields (CVSS, severity, KEV) are nice-to-have for Phase 3.
//
// Rate limiting:
// - Anonymous tier is 5 requests per 30 seconds. Client-side min-interval
//   throttle defaults to 6500 ms between calls to stay under.
// - With an NVD_API_KEY, limit is 50/30 s; throttle drops to 800 ms.
// - On 429 we honor Retry-After, then give up gracefully and return
//   `rateLimited: true` rather than throwing. Rationale: NVD outages
//   shouldn't false-positive-fail articles at factcheck. The caller
//   (cve_cache) treats rate-limited lookups as "exists=true, unverified"
//   so the LLM's CVE claim is trusted for this run; the 14-day cache TTL
//   re-verifies on a future run when rate limits have cleared.

export interface NvdLookupResult {
  exists: boolean;
  cvssV31: number | null;
  severity: string | null;
  summary: string | null;
  rawJson: string | null;
  rateLimited?: boolean;
}

export interface NvdClient {
  lookup(cveId: string): Promise<NvdLookupResult>;
}

export interface NvdClientOptions {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
  /** Max retries on 429. Default 2. */
  maxRetries?: number;
  /** Called between retries; default: real setTimeout. Tests inject instant resolves. */
  sleep?: (ms: number) => Promise<void>;
  endpoint?: string;
  /**
   * Minimum milliseconds between consecutive calls to stay under the NVD rate
   * limit. Default 6500 anon, 800 with key. Override to 0 in tests.
   */
  minIntervalMs?: number;
  /** Test seam: monotonic clock. Default: Date.now. */
  now?: () => number;
}

const DEFAULT_ENDPOINT = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const DEFAULT_MIN_INTERVAL_ANON_MS = 6500;
const DEFAULT_MIN_INTERVAL_KEY_MS = 800;

export function createNvdClient(options: NvdClientOptions = {}): NvdClient {
  const apiKey = options.apiKey ?? process.env.NVD_API_KEY;
  const fetchFn = options.fetch ?? globalThis.fetch;
  const maxRetries = options.maxRetries ?? 2;
  const sleep = options.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const now = options.now ?? (() => Date.now());
  const minIntervalMs =
    options.minIntervalMs ?? (apiKey ? DEFAULT_MIN_INTERVAL_KEY_MS : DEFAULT_MIN_INTERVAL_ANON_MS);

  let lastCallAt = 0;

  return {
    async lookup(cveId: string): Promise<NvdLookupResult> {
      // Client-side throttle: sleep until the minimum interval has passed
      // since our last request. Stays ahead of the rate limit so 429s are
      // rare rather than the common case.
      const elapsed = now() - lastCallAt;
      if (elapsed < minIntervalMs) {
        await sleep(minIntervalMs - elapsed);
      }
      lastCallAt = now();

      const url = `${endpoint}?cveId=${encodeURIComponent(cveId)}`;
      const headers: Record<string, string> = {};
      if (apiKey) headers["apiKey"] = apiKey;

      let attempt = 0;
      while (true) {
        const res = await fetchFn(url, { headers });
        if (res.status === 429) {
          if (attempt < maxRetries) {
            const retryAfter = Number(res.headers.get("retry-after") ?? "30");
            await sleep(Math.max(1, retryAfter) * 1000);
            lastCallAt = now();
            attempt++;
            continue;
          }
          // Graceful degrade: return "unverified" so factcheck doesn't fail.
          return {
            exists: true,
            cvssV31: null,
            severity: null,
            summary: null,
            rawJson: null,
            rateLimited: true,
          };
        }
        if (res.status === 404) {
          return { exists: false, cvssV31: null, severity: null, summary: null, rawJson: null };
        }
        if (!res.ok) {
          throw new Error(`NVD lookup failed for ${cveId}: ${res.status} ${res.statusText}`);
        }
        const body = (await res.json()) as NvdResponse;
        if (!body.vulnerabilities || body.vulnerabilities.length === 0) {
          return { exists: false, cvssV31: null, severity: null, summary: null, rawJson: JSON.stringify(body) };
        }
        const cve = body.vulnerabilities[0]!.cve;
        const metric = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
        const summary = cve.descriptions?.find((d) => d.lang === "en")?.value ?? null;
        return {
          exists: true,
          cvssV31: metric?.baseScore ?? null,
          severity: metric?.baseSeverity ?? null,
          summary,
          rawJson: JSON.stringify(body),
        };
      }
    },
  };
}

interface NvdResponse {
  vulnerabilities?: Array<{
    cve: {
      descriptions?: Array<{ lang: string; value: string }>;
      metrics?: {
        cvssMetricV31?: Array<{ cvssData: { baseScore: number; baseSeverity: string } }>;
      };
    };
  }>;
}
