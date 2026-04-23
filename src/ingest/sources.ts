// RSS/Atom source list per PRD §7.1. Tier mapping per entities.yaml trusted_sources.

export type SourceTier = "primary" | "secondary" | "aggregator" | "vendor" | "advisory";

export interface SourceFeed {
  id: string;
  name: string;
  url: string;
  tier: SourceTier;
}

export const SOURCES: readonly SourceFeed[] = [
  { id: "krebs",            name: "Krebs on Security",   url: "https://krebsonsecurity.com/feed/",                       tier: "primary"   },
  { id: "therecord",        name: "The Record",          url: "https://therecord.media/feed",                            tier: "primary"   },
  { id: "riskybiz",         name: "Risky Biz News",      url: "https://news.risky.biz/feed/",                            tier: "primary"   },
  { id: "bleepingcomputer", name: "BleepingComputer",    url: "https://www.bleepingcomputer.com/feed/",                  tier: "secondary" },
  { id: "darkreading",      name: "Dark Reading",        url: "https://www.darkreading.com/rss_simple.asp",              tier: "secondary" },
  { id: "securityweek",     name: "SecurityWeek",        url: "https://www.securityweek.com/feed/",                      tier: "secondary" },
  { id: "cyberscoop",       name: "CyberScoop",          url: "https://cyberscoop.com/feed/",                            tier: "secondary" },
  { id: "arstechnica_sec",  name: "Ars Technica – Security", url: "https://feeds.arstechnica.com/arstechnica/security", tier: "secondary" },
  { id: "csoonline",        name: "CSO Online",          url: "https://www.csoonline.com/index.rss",                     tier: "secondary" },
  { id: "thehackernews",    name: "The Hacker News",     url: "https://feeds.feedburner.com/TheHackersNews",             tier: "aggregator" },
  { id: "schneier",         name: "Schneier on Security",url: "https://www.schneier.com/feed/",                          tier: "primary"   },
  { id: "google_security",  name: "Google Security Blog",url: "https://security.googleblog.com/feeds/posts/default",     tier: "vendor"    },
  { id: "github_advisories",name: "GitHub Security Advisories", url: "https://github.com/advisories.atom",               tier: "advisory"  },
] as const;

/** Best-effort lookup: match an article URL's hostname back to a configured source feed. */
export function getSourceByCanonicalUrl(url: string): SourceFeed | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const s of SOURCES) {
    try {
      const sHost = new URL(s.url).hostname.toLowerCase();
      if (host === sHost || host.endsWith(`.${sHost}`) || sHost.endsWith(`.${host}`)) return s;
    } catch {
      continue;
    }
  }
  return null;
}
