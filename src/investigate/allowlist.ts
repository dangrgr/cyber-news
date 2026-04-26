// Hostname allowlist for the investigation agent's `fetch_url` tool.
// Mirrors PRD §11.3 network_allowlist. A URL outside this list returns
// an error to the model rather than leaking GH-runner IP to arbitrary
// domains or executing fetches against adversary-adjacent infrastructure.

export const DEFAULT_ALLOWLIST: readonly string[] = [
  // anthropic infra (unused at fetch time but consistent with PRD)
  "*.anthropic.com",
  // gov advisories
  "www.cisa.gov",
  "cisa.gov",
  "services.nvd.nist.gov",
  "nvd.nist.gov",
  "attack.mitre.org",
  // vendor PSIRTs
  "msrc.microsoft.com",
  "sec.cloudapps.cisco.com",
  "security.paloaltonetworks.com",
  "unit42.paloaltonetworks.com",
  "*.talosintelligence.com",
  "cloud.google.com",
  // tier-1 reporting
  "krebsonsecurity.com",
  "therecord.media",
  "news.risky.biz",
  // tier-2 reporting
  "www.bleepingcomputer.com",
  "bleepingcomputer.com",
  "www.darkreading.com",
  "darkreading.com",
  "www.securityweek.com",
  "securityweek.com",
  "cyberscoop.com",
  // local DB (read-only token)
  "*.turso.io",
];

/**
 * True if `url`'s hostname is allowed. Wildcard entries match one or more
 * subdomain labels (`*.foo.com` matches `a.foo.com` and `a.b.foo.com`, not
 * `foo.com` itself — add `foo.com` explicitly if needed). Only http(s)
 * URLs are considered; any other scheme is rejected.
 */
export function isAllowed(url: string, allowlist: readonly string[] = DEFAULT_ALLOWLIST): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  for (const entry of allowlist) {
    const e = entry.toLowerCase();
    if (e.startsWith("*.")) {
      const suffix = e.slice(2);
      if (host.endsWith("." + suffix)) return true;
    } else if (host === e) {
      return true;
    }
  }
  return false;
}
