// NVD 2.0 CVE lookup. Used only for existence check in Phase 2 factcheck;
// the richer fields (CVSS, severity, KEV) are nice-to-have for Phase 3.
//
// Rate limiting: anonymous tier is 5 requests per 30 seconds. With an
// NVD_API_KEY, it's 50 per 30 seconds. On 429 we honor Retry-After.

export interface NvdLookupResult {
  exists: boolean;
  cvssV31: number | null;
  severity: string | null;
  summary: string | null;
  rawJson: string | null;
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
}

const DEFAULT_ENDPOINT = "https://services.nvd.nist.gov/rest/json/cves/2.0";

export function createNvdClient(options: NvdClientOptions = {}): NvdClient {
  const apiKey = options.apiKey ?? process.env.NVD_API_KEY;
  const fetchFn = options.fetch ?? globalThis.fetch;
  const maxRetries = options.maxRetries ?? 2;
  const sleep = options.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;

  return {
    async lookup(cveId: string): Promise<NvdLookupResult> {
      const url = `${endpoint}?cveId=${encodeURIComponent(cveId)}`;
      const headers: Record<string, string> = {};
      if (apiKey) headers["apiKey"] = apiKey;

      let attempt = 0;
      while (true) {
        const res = await fetchFn(url, { headers });
        if (res.status === 429 && attempt < maxRetries) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "30");
          await sleep(Math.max(1, retryAfter) * 1000);
          attempt++;
          continue;
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
