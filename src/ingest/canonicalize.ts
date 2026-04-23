// Canonical URL: lowercase host, strip tracking params, strip fragment, drop trailing slash.
// PRD §8.1. Matters because dedup keys off canonical_url and id = sha256(canonical_url).

import { createHash } from "node:crypto";

const TRACKING_PARAM_PREFIXES = ["utm_", "mc_"];
const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "yclid",
  "dclid",
  "igshid",
  "mkt_tok",
  "ref",
  "ref_src",
  "ref_url",
  "referrer",
  "source",
  "_hsenc",
  "_hsmi",
  "hsCtaTracking",
]);

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  if (TRACKING_PARAMS.has(lower)) return true;
  for (const prefix of TRACKING_PARAM_PREFIXES) {
    if (lower.startsWith(prefix)) return true;
  }
  return false;
}

export function canonicalizeUrl(raw: string): string {
  const u = new URL(raw.trim());
  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  if ((u.protocol === "http:" && u.port === "80") || (u.protocol === "https:" && u.port === "443")) {
    u.port = "";
  }

  // Strip tracking params; preserve order of survivors.
  const survivors: [string, string][] = [];
  for (const [name, value] of u.searchParams) {
    if (!isTrackingParam(name)) survivors.push([name, value]);
  }
  // URLSearchParams has no clear() in older Node typings; rebuild via assignment.
  const rebuilt = new URLSearchParams();
  for (const [name, value] of survivors) rebuilt.append(name, value);
  u.search = rebuilt.toString() ? `?${rebuilt.toString()}` : "";

  // Drop a trailing slash on path, but never on the root.
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.slice(0, -1);
  }

  return u.toString();
}

export function articleId(canonicalUrl: string): string {
  return createHash("sha256").update(canonicalUrl).digest("hex");
}
