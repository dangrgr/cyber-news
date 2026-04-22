# Cyber News Dissector — PRD

**Personal use. Serverless-first. Model choices open.**

Owner: Dan
Status: Draft v1
Last updated: April 21, 2026

---

## 1. Overview

A personal cybersecurity news pipeline that ingests articles and advisories from ~20 sources, extracts structured incident data with LLM-based triage, runs always-on fact-checking against the source text, posts summaries to a Discord channel, and allows on-demand deep-dive investigations that post back as threads.

The system is inspired by analyst-style synthesis pieces like Ringmast4r's "We May Be Living Through the Most Consequential Hundred Days in Cyber History." The goal is not to reproduce that kind of publication, but to keep the owner continuously oriented to the current state of the cyber threat landscape without having to read 50 articles a day.

## 2. Goals

- Maintain situational awareness across the major cyber news sources without manual reading
- Surface only triaged, fact-checked incidents into the reading channel
- Enable on-demand deep-dive investigation of any incident using an agentic research loop with web search and vendor advisory review
- Keep infrastructure cost at or near zero
- Keep monthly LLM + search spend under $15

## 3. Non-Goals

- Public publishing, Substack output, or shared internal intel
- Replacing commercial threat intelligence platforms
- Real-time alerting for active incident response
- Copyright-sensitive content handling (personal fair use scope)
- Multi-user access, auth, permissions

## 4. Users

One user (Dan). Reads primarily on iOS Discord mobile.

## 5. Architecture

### 5.1 Recommended: Hybrid Serverless (GH Actions + Claude Code Routines)

The pipeline splits cleanly by workload type: GH Actions handles everything stateless (polling, dedup, triage, extract, fact-check, publish), while the agentic investigation stage runs inside a Claude Code Routine where Anthropic's harness handles sandboxing, MCP orchestration, checkpointing, and tracing.

```
┌────────────────────┐
│  GitHub Repo       │  ← code, entity YAML, logs, routine.yaml
└──────────┬─────────┘
           │
     ┌─────┴─────────────────────────────────────────┐
     │                                               │
┌────▼─────────────┐                     ┌───────────▼───────────┐
│ GH Actions       │                     │ GH Actions            │
│ (scheduled)      │                     │ (workflow_dispatch)   │
│ every 30 min     │                     │ on-demand             │
│                  │                     │                       │
│ - poll sources   │                     │ - invoke Routine via  │
│ - dedup          │                     │   Anthropic API       │
│ - triage (Haiku) │                     │ - pass incident_id    │
│ - extract (Haiku)│                     │ - await completion    │
│ - fact-check     │                     │ - post result to      │
│ - post to        │                     │   Discord thread      │
│   #cyber-news    │                     └───────────┬───────────┘
└────┬─────────────┘                                 │
     │                                               │
     │                                      ┌────────▼────────────┐
     │                                      │ Claude Code Routine │
     │                                      │ (Anthropic-hosted)  │
     │                                      │                     │
     │                                      │ - Sonnet-class model│
     │                                      │ - MCP: Brave search │
     │                                      │ - MCP: Playwright   │
     │                                      │ - MCP: Turso query  │
     │                                      │ - MCP: NVD/KEV      │
     │                                      │ - built-in web fetch│
     │                                      │ - sandboxed runtime │
     │                                      │ - session tracing   │
     │                                      └────────┬────────────┘
     │                                               │
     │          ┌──────────────────────┐             │
     └─────────►│ Turso (libSQL/SQLite)│◄────────────┘
                │ - incidents          │
                │ - articles           │
                │ - entities cache     │
                │ - actor aliases      │
                └──────────┬───────────┘
                           │
                ┌──────────▼──────────┐
                │ Discord webhooks    │
                │ - #cyber-news       │
                │ - #cyber-investigations
                └─────────────────────┘
```

**Why this is the right answer for this workload:**

- Inherently batch: polling RSS every 30 minutes maps perfectly onto a cron-triggered Action.
- No always-on component needed. No Discord slash commands in v1.
- Entire state lives in two places: Turso (incidents/articles/entities) and Git (code, entity YAML, logs).
- Logs are committed markdown in a `logs/` directory — readable on the GitHub mobile app, audit-trail for free, version-controlled by accident.
- Investigation triggers are `workflow_dispatch` events fired from the GitHub mobile app (or a Discord message containing a special trigger phrase, polled on schedule — see 5.3).
- Every cost component has a free tier that comfortably covers personal volume.

**Component list:**

| Component | Role | Cost |
|---|---|---|
| GitHub Actions | Scheduler + compute | Free (2000 min/mo private, plenty at 30-min cadence) |
| Turso | Managed libSQL database | Free tier (9 GB storage, 1B row reads/mo) |
| Cloudflare Worker *(optional, v2)* | Discord interaction endpoint | Free tier (100k req/day) |
| Discord | Output UI | Free |
| Anthropic API (Haiku) | Triage + extraction + fact-check | ~$3–5/mo |
| Anthropic API (Sonnet) | Investigation tokens | ~$3–5/mo |
| Claude Code Routines | Investigation runtime, MCP harness, sandboxing, tracing | $0.08/session-hr (~$0.20–0.50/mo at 5 investigations/wk × ~5 min each) |
| Brave Search API | Corroboration (GH Actions) + agent research (Routine) | Free tier (2000 q/mo) |

**Estimated total: $6–11/month, all LLM + search + runtime. Zero infra.**

### 5.2 Alternative: Fly.io

If the serverless path proves fiddly — Turso latency from Actions, Discord interaction complexity, or desire for a long-running listener — fall back to:

- One Fly.io machine (shared-cpu-1x, 256 MB)
- SQLite on a volume
- node-cron inside the app
- Express endpoint for Discord interactions (no CF Worker needed)

Cost: ~$3–5/month Fly + same LLM/search. Simpler mental model, single process, easier debugging. Use this if the serverless path takes more than a weekend to stand up.

### 5.3 Investigation trigger — three options

In order of simplicity:

1. **GH mobile app `workflow_dispatch`.** Tap Actions → Investigate → paste incident ID. Zero infra. Ugly but works day one.
2. **Discord reaction polling.** GH Actions runs every 5 minutes checking for a 🔍 reaction on messages in `#cyber-news`. If found, dispatches the investigation workflow and removes the reaction. Latency: ~5 min. Still serverless.
3. **Cloudflare Worker interaction endpoint.** Proper Discord slash command `/investigate`. Worker verifies signature, ACKs in <3s, fires `repository_dispatch`. Latency: seconds. Slightly more setup (Discord app registration, Ed25519 verification).

Ship v1 with option 1. Add option 2 in week two. Option 3 is future polish if desired.

### 5.4 Why this split — GH Actions vs Routines vs Managed Agents

"LLM tasks" are not one workload. They split into two kinds with different economics and different optimal homes. This section documents the reasoning so future changes don't accidentally merge them back.

**Stateless short calls** — triage, extract, fact-check. Each is one prompt → structured JSON → done. Sub-second, no tools, no state between calls. These belong in GH Actions with direct API calls. Using a managed agent harness for these pays a session-hour charge for infrastructure (sandboxing, checkpointing, MCP orchestration, tracing) that is not being exercised.

**Single-shot agentic tasks** — investigation. Multi-turn, uses tools, needs sandboxed execution for things like `fetch_url` against adversary-adjacent domains, benefits from persisted traces. These belong in Claude Code Routines, where the harness earns its $0.08/session-hour.

**Long-running multi-session agents** — not present in this design. If the investigation stage ever becomes conversational (reply in a Discord thread, agent continues the same session with full context rather than starting fresh), that would be the trigger to migrate from Routines to full Managed Agents. Routines treat each invocation as isolated; Managed Agents persist event history server-side and accept mid-execution user events. Not needed for v1. Flagged here as a known graduation path.

Cost comparison at this workload's volume (~20 investigations/month, ~3600 stateless calls/month):

| Approach | Stateless compute | Agentic runtime | Monthly total |
|---|---|---|---|
| Everything in GH Actions (roll own tool loop for investigation) | $0 | $0 + more code to maintain | ~$11 |
| **Hybrid: GH Actions + Routines for investigation** | $0 | ~$0.15 runtime | **~$11** |
| Everything in Managed Agents (sessions for each stateless call) | ~$4–8 runtime | included | ~$15–19 |

The hybrid is strictly better than the all-Managed-Agents path at this volume. It is roughly tied with pure GH Actions on cost but meaningfully less code to maintain, because the agentic harness (MCP servers, tool retries, rate limiting, tracing, sandboxing) is Anthropic's problem not the owner's.

### 5.5 Language choice — TypeScript spine, Python permitted for research

The pipeline is implemented in **TypeScript** (Node 20+ or Bun). This choice is deliberate and worth recording.

**Why TypeScript for the spine:**

- Consistency with the owner's existing stack (Pinchy is React/Node; the Ghost Slack bot is TypeScript; the existing agentic coding infra uses the Agent SDK in TypeScript).
- The Anthropic ecosystem is Node-first. Claude Code itself is Node. MCP servers (Playwright, libSQL, Brave) are predominantly Node processes, so the investigation Routine is already running Node even if the pipeline weren't — choosing TS collapses the stack to one language.
- Strict-mode typing catches schema drift between pattern `schema.json` and downstream code at compile time. This is legitimately useful in a pipeline whose correctness depends on structured outputs flowing cleanly between stages.
- Turso's libSQL client, `rss-parser`, `@mozilla/readability`, and `discord.js` are all first-class TS and adequate for our scale.

**Why not Python despite its strong CTI ecosystem:**

Python has real advantages for CTI work — MISP bindings, STIX/TAXII libraries, pyattck, and the academic corpus (Tseng 2407.13093, Meng 2509.23573, TTPXHunter, LLMCloudHunter) is all Python. For this project at personal scale, we don't need those libraries in the hot path. Consuming STIX or ATT&CK is a cached-JSON exercise, not a library integration. The stack-consistency win outweighs the per-library disadvantage.

**Where Python is explicitly permitted:**

The `scripts/` directory is allowed to use Python for research, evaluation, and one-off analysis tasks:

- Extraction quality evals (F1 on a hand-labeled sample)
- Voting-agreement comparisons (reproducing arxiv 2407.13093 methodology on our corpus)
- STIX bundle processing if we ever need to ingest MITRE ATT&CK programmatically beyond the cached JSON
- pandas-driven weekly analytics once enough data accumulates

Python here is invoked on-demand, never by the pipeline. Keeping it out of the hot path preserves the TS consistency; admitting it in `scripts/` avoids reimplementing mature CTI libraries in TS for no reason.

**Directory layout:**

```
cyber-dissector/
├── CLAUDE.md                 # repo-level agent instructions
├── docs/
│   ├── PRD.md               # this document
│   └── research-notes.md
├── src/                      # TypeScript — pipeline, patterns runner, Discord, Turso client
│   ├── ingest/
│   ├── pipeline/
│   ├── discord/
│   ├── turso/
│   └── hooks/
├── patterns/                 # language-agnostic pattern definitions
│   ├── triage/
│   │   ├── pattern.md
│   │   └── schema.json
│   ├── extract/
│   ├── factcheck/
│   ├── investigate/
│   ├── vendor_doc_review/
│   └── synthesize/
├── routines/
│   └── investigate.yaml      # Claude Code Routine definition
├── migrations/               # Turso SQL migrations
├── scripts/                  # Python permitted here for eval/research
│   └── eval/
├── tests/
│   └── patterns/             # fixture tests per pattern
├── entities.yaml             # hand-maintained canonical aliases + campaigns
├── .github/
│   └── workflows/
│       ├── ingest.yml
│       └── investigate.yml
└── logs/                     # JSONL run logs + investigation drafts, committed by workflows
    ├── runs/
    └── investigations/
```

**Escape hatch:** if a future workload (e.g., fine-tuning an extractor on accumulated thumbs-up/down data, running TTPXHunter-style F1 evals at scale) makes Python the natural spine for that specific task, run it as a separate GH Actions step alongside the TS pipeline. This is a language decision for the pipeline, not a lock-in.

## 6. Data Model

SQLite schema (works identically on Turso or Fly.io):

```sql
-- Every article ever ingested, before any LLM processing
CREATE TABLE articles (
  id              TEXT PRIMARY KEY,       -- sha256(canonical_url)
  source_id       TEXT NOT NULL,          -- e.g., "krebs", "bleepingcomputer"
  url             TEXT NOT NULL UNIQUE,
  canonical_url   TEXT NOT NULL,
  title           TEXT NOT NULL,
  author          TEXT,
  published_at    TEXT NOT NULL,          -- ISO 8601
  ingested_at     TEXT NOT NULL,
  raw_text        TEXT NOT NULL,          -- full article body
  stage_reached   TEXT NOT NULL,          -- deduped | pre_filtered | triage_rejected
                                          -- extracted | factcheck_failed | published
  failure_reason  TEXT,
  incident_id     TEXT                    -- FK to incidents, null if rejected/standalone
);
CREATE INDEX idx_articles_stage ON articles(stage_reached);
CREATE INDEX idx_articles_published ON articles(published_at DESC);

-- One row per distinct incident (may aggregate multiple articles)
CREATE TABLE incidents (
  id                   TEXT PRIMARY KEY,    -- generated
  first_seen_at        TEXT NOT NULL,
  last_updated_at      TEXT NOT NULL,
  title                TEXT NOT NULL,
  summary              TEXT NOT NULL,       -- strict attribution discipline
  incident_date        TEXT,                -- ISO 8601 date the event occurred
  confidence           TEXT NOT NULL,       -- claim | reported | confirmed
  victim_orgs          TEXT NOT NULL,       -- JSON array
  threat_actors        TEXT NOT NULL,       -- JSON array (canonical names)
  cves                 TEXT NOT NULL,       -- JSON array
  initial_access_vector TEXT,
  ttps                 TEXT,                -- JSON array
  impact_json          TEXT,                -- JSON blob per extraction schema
  campaign_tags        TEXT,                -- JSON array, e.g., ["SLH", "Handala"]
  corroboration_count  INTEGER DEFAULT 1,
  source_urls          TEXT NOT NULL,       -- JSON array
  discord_message_id   TEXT,                -- for thread replies
  investigation_status TEXT DEFAULT 'none'  -- none | pending | complete
);
CREATE INDEX idx_incidents_date ON incidents(incident_date DESC);
CREATE INDEX idx_incidents_actors ON incidents(threat_actors);

-- Canonical entity resolution cache (built from entity YAML + extraction results)
CREATE TABLE entity_aliases (
  alias         TEXT NOT NULL,
  canonical     TEXT NOT NULL,
  entity_type   TEXT NOT NULL,       -- actor | campaign | org
  confidence    REAL NOT NULL,       -- 1.0 for YAML-defined, <1.0 for LLM-inferred
  PRIMARY KEY (alias, entity_type)
);

-- Investigation drafts (full markdown bodies)
CREATE TABLE investigations (
  id              TEXT PRIMARY KEY,
  incident_id     TEXT NOT NULL,
  requested_at    TEXT NOT NULL,
  completed_at    TEXT,
  model_used      TEXT,
  draft_markdown  TEXT,
  evidence_json   TEXT,               -- URL → snippet mapping
  cost_usd        REAL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id)
);
```

The `stage_reached` field is the core observability primitive: one row per article, lifecycle state on each, never deleted. Every post-mortem starts with a SELECT on that column.

## 7. Sources

Initial set. All free, all pull-based.

### 7.1 RSS / Atom (primary)

- Krebs on Security — `krebsonsecurity.com/feed`
- BleepingComputer — `bleepingcomputer.com/feed`
- The Record (Recorded Future) — `therecord.media/feed`
- Risky Biz News — `news.risky.biz/feed`
- The Hacker News — `feeds.feedburner.com/TheHackersNews`
- Dark Reading — `darkreading.com/rss_simple.asp`
- CyberScoop — `cyberscoop.com/feed`
- SecurityWeek — `securityweek.com/feed`
- Ars Technica security channel — `feeds.arstechnica.com/arstechnica/security`
- CSO Online — `csoonline.com/index.rss`
- GitHub Security Advisories — `github.com/advisories.atom` (filter to critical/high)
- Substack sources — append `/feed` to any Substack URL (Ringmast4r, Risky Biz, Return on Security, TLDR Sec if RSS'd)

### 7.2 Structured data (APIs)

- **CISA KEV** — `cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` — poll daily, diff against local cache, emit new additions as high-signal events
- **NVD 2.0 API** — `services.nvd.nist.gov/rest/json/cves/2.0` — on-demand lookups by CVE ID during extraction and fact-check
- **MITRE ATT&CK STIX** — quarterly static refresh into entity cache

### 7.3 Email-only (v2)

Skip in v1. When added: spin up `dan.secnews@gmail.com`, subscribe newsletters, IMAP poll from a scheduled Action using app password. Zero additional infra.

## 8. Pipeline Stages

```
SOURCE → INGEST → DEDUP → PRE-FILTER → TRIAGE → EXTRACT → FACT-CHECK → PUBLISH
                                          │          │          │           │
                                       [skip]    [logs]     [logs]     #cyber-news
                                                                            │
                                                              user taps "investigate"
                                                                            │
                                                              INVESTIGATE (Sonnet agent)
                                                                            │
                                                                 #cyber-investigations thread
```

### 8.1 Ingest

Every 30 minutes (GH Actions cron):
- Fetch each RSS feed, parse via `rss-parser`
- For each entry, compute canonical URL (strip UTM params, lowercase host, remove trailing slash)
- For each entry, fetch full article body via `@mozilla/readability` on a fresh jsdom
- Insert into `articles` with `stage_reached = 'deduped'` if URL not already present

Cost: $0. Time: ~2 min per run.

### 8.2 Dedup (deterministic)

- URL uniqueness on insert
- Title fuzzy match via rapidfuzz (ratio > 85 within 7-day window → same as existing article, link to same `incident_id`)
- No LLM involvement

### 8.3 Pre-filter (deterministic)

For each new article, compute:
- CVE IDs via regex `/CVE-\d{4}-\d{4,7}/g`
- Known entity hits by substring match against `entity_aliases.alias`
- Known-high-signal keyword hits (`ransomware`, `breach`, `exfiltrated`, `zero-day`, `CVE`, `APT`, etc.)

Score: `1.0 * (cve_count > 0) + 1.5 * known_entity_hits + 0.5 * keyword_hits + 0.3 * (source_tier == 'primary')`.

- Score < 1.0 → `stage_reached = 'pre_filtered'`, skip LLM entirely
- Score ≥ 1.0 → proceed to triage

This kills 60–80% of articles before spending a token.

### 8.4 Triage (Haiku-class)

One cheap LLM call per survivor. See prompt 10.1. Classifies `process` vs `skip`.

### 8.5 Extract (Haiku-class)

Structured JSON per article. See prompt 10.2.

After extraction, resolve entity names:
1. For each victim/actor in extraction, look up in `entity_aliases`
2. If found, attach canonical name
3. If not found, store as-is and flag for weekly YAML review

### 8.6 Fact-check (always on, gates publication)

**Deterministic checks (always run):**

- `CVE validity` — every CVE ID resolves via NVD cache. Fail if hallucinated ID.
- `Date sanity` — incident_date within [article.published_at - 90 days, article.published_at + 7 days]. Fail otherwise.
- `Entity-in-article` — every victim/actor/CVE appears as substring (or ≥85% fuzzy match) in `raw_text`. Fail if any entity is not present.
- `Claim-language alignment` — if article contains any of [`claims`, `alleges`, `reportedly`, `unverified`, `attributed to`] near an entity, extraction's `confidence` must be `claim` or `reported`. Fail on `confirmed` with claim markers present.

**LLM check (always run):**

One Haiku call verifying each non-null field in the JSON is supported by the article. See prompt 10.3.

**Corroboration check (display only, not a gate):**

One Brave search per article: `"<top victim>" "<top actor>" breach OR hack OR compromise`. Count matches on trusted-tier domains. Result goes into the Discord embed as a colored dot.

**Gate outcome:**

- All deterministic checks pass AND LLM check returns `pass` → publish to `#cyber-news`
- Any check fails → `stage_reached = 'factcheck_failed'`, `failure_reason` set, not published

### 8.7 Publish

Post to Discord webhook for `#cyber-news`. Format in section 11.

### 8.8 Investigate (on-demand)

User triggers via `workflow_dispatch` with `incident_id`. The workflow invokes a pre-defined Claude Code Routine via the Anthropic API, passing the incident_id and the source-zero extraction as input. The Routine runs Sonnet-class with MCP servers for Brave Search, Playwright URL fetching, Turso queries (read-only), and NVD/KEV lookups. See prompt 10.4 and the routine YAML in section 11.3. The Routine produces a markdown draft + evidence bundle, returned as structured output. The GH Actions workflow posts the result as a Discord thread in `#cyber-investigations` and persists the draft to `investigations` table and `logs/investigations/{incident_id}.md`.

## 9. Entity Knowledge Base

A hand-maintained YAML file committed to the repo at `entities.yaml`. The single highest-leverage artifact in the system. Seed from the Ringmast4r piece.

```yaml
version: 1
last_updated: 2026-04-21

actors:
  - canonical: "Void Manticore"
    aliases: ["Handala", "Handala Hack Team", "Banished Kitten", "Red Sandstorm", "Storm-842"]
    attribution: "Iranian MOIS"
    type: "state"
    notes: "Persona for MOIS destructive ops. Successor to Homeland Justice, Karma."

  - canonical: "SLH"
    aliases: ["Scattered LAPSUS$ Hunters", "Trinity of Chaos"]
    type: "alliance"
    members: ["ShinyHunters", "Scattered Spider", "Lapsus$"]
    notes: "Aug 2025 merger. ShinyHunters = exfil/extortion; Scattered Spider = initial access via vishing; Lapsus$ = identity compromise."

  - canonical: "ShinyHunters"
    aliases: []
    notes: "Part of SLH alliance. Handles exfil and leak-site ops."

  - canonical: "Scattered Spider"
    aliases: ["UNC3944", "Octo Tempest"]
    notes: "Part of SLH alliance. Social engineering / vishing specialists."

  - canonical: "Lapsus$"
    aliases: ["LAPSUS$"]
    notes: "Part of SLH alliance. Identity-system compromise."

  - canonical: "UNC1069"
    aliases: []
    attribution: "North Korea (GTIG)"
    notes: "Axios npm hijack March 2026."

  - canonical: "APT28"
    aliases: ["Fancy Bear", "Forest Blizzard", "STRONTIUM"]
    attribution: "Russia GRU"

  - canonical: "Volt Typhoon"
    aliases: []
    attribution: "PRC"
    notes: "Critical infrastructure pre-positioning."

  - canonical: "Salt Typhoon"
    aliases: []
    attribution: "PRC MSS"
    notes: "Telecom-focused; US carrier compromises 2024-2025."

campaigns:
  - canonical: "SLH-Salesforce-2025-2026"
    actors: ["SLH"]
    start_date: "2025-08"
    status: "active"
    notes: "Vishing-led Salesforce theft. ~400 orgs, ~1.5B records claimed. Key victims: Google, Cisco, Qantas, LVMH, Allianz, Adidas, Chanel."

  - canonical: "Handala-Retaliation-2026"
    actors: ["Void Manticore"]
    start_date: "2026-03"
    status: "active"
    notes: "Stated retaliation for Feb 28 Minab school strike. Stryker, Lockheed doxx, Patel Gmail."

watched_orgs:
  critical:
    - "Salesforce"
    - "Snowflake"
    - "Okta"
    - "Microsoft"
    - "Cisco"
  relevant_to_me:
    - "Locally Compact"
    - "Anthropic"
    - "UniFi"

watched_cves_proactive: []  # CVEs to alert on regardless of other signal

trusted_sources:
  tier_1:  # primary investigative reporting
    - krebsonsecurity.com
    - therecord.media
    - news.risky.biz
  tier_2:  # solid secondary
    - bleepingcomputer.com
    - darkreading.com
    - securityweek.com
    - cyberscoop.com
  tier_3:  # aggregators
    - thehackernews.com
    - hackread.com
  vendor_authoritative:
    - msrc.microsoft.com
    - unit42.paloaltonetworks.com
    - cloud.google.com/blog/topics/threat-intelligence
    - blog.talosintelligence.com
    - cisa.gov
```

## 10. Patterns

Each LLM-driven stage in the pipeline is implemented as a **Pattern** — a single-purpose prompt with a defined input/output contract, living in `patterns/{pattern_name}/` with a `pattern.md` (system prompt) and `schema.json` (strict output shape). This abstraction is borrowed from Daniel Miessler's Fabric project. Benefits: each pattern is independently testable against input fixtures, swappable without pipeline changes, and structurally similar enough that a future port to Fabric (as e.g. `analyze_cyber_news_article`) is near-free.

Current patterns:

- `triage` — classify an article as process/skip (§10.1)
- `extract` — structured incident JSON from an article (§10.2)
- `factcheck` — verify extraction fidelity against source text, plus new relationship-fidelity check (§10.3)
- `investigate` — the research-agent system prompt for the Claude Code Routine (§10.4)
- `vendor_doc_review` — sub-pattern invoked from within `investigate` on vendor advisories (§10.5)
- `synthesize` — optional weekly digest (§10.6, v2)

All patterns produce strict JSON except `investigate` which is freeform markdown with structured citation discipline.

### 10.1 Triage

```
You are a cybersecurity news triage classifier. Decide whether an article describes a novel, significant incident worth further processing.

You receive:
- The article title, URL, source, and first 1500 characters of body
- The nearest existing incident from the local database (may be null)

Decision criteria:

NOVEL means: describes an event not substantively covered by the nearest existing incident. Qualifies if: different event entirely; same event but substantial new fact (attribution, victim count, vector, CVE); same event but >72h later with meaningful update.

SIGNIFICANT means AT LEAST ONE of:
- Named victim organization (not generic "a company")
- Named threat actor or attribution claim
- Exploited CVE referenced
- Affected count stated (users, devices, orgs)
- Nation-state or APT attribution
- Critical infrastructure sector (healthcare, utilities, telecom, finance, defense, aviation, government)
- Supply chain or third-party compromise
- Novel TTP or first-reported technique

SKIP means: opinion/commentary only; vendor product marketing; recycled summary with no new information; duplicate of existing incident with no new facts; pure how-to content.

<article>
TITLE: {title}
URL: {url}
SOURCE: {source}
PUBLISHED: {published_at}
BODY_PREVIEW: {body_1500}
</article>

<nearest_existing_incident>
{nearest_incident_json_or_null}
</nearest_existing_incident>

Output JSON only, no prose:

{
  "decision": "process" | "skip",
  "novel": boolean,
  "significant": boolean,
  "duplicate_of": string | null,
  "reason": string
}
```

### 10.2 Extraction

```
You are extracting structured cybersecurity incident data from a news article. You are conservative: you extract only what the article explicitly states or directly implies. You never infer, guess, or invent.

CRITICAL RULES:
1. Every entity you extract (victim org, threat actor, CVE) MUST appear as a literal substring in the article text. If it is not in the text, it is not in your output.
2. **Co-mention guard (from arxiv 2509.23573 §1.1).** The article may mention organizations that are NOT victims of THIS incident — they may be context, prior victims of other incidents, or unrelated companies referenced for comparison. Split org mentions into two fields:
   - `victim_orgs_confirmed`: orgs that the article explicitly names as a victim of the specific incident being described.
   - `orgs_mentioned`: other orgs referenced in the article for context or comparison. These are NOT victims of this incident.
   Same split applies to `threat_actors_attributed` (for this incident) vs `actors_mentioned` (context only).
3. Attribution discipline:
   - If the article uses any of: "claims", "alleges", "reportedly", "unverified", "said to", "according to [non-authoritative source]" — set confidence to "claim"
   - If the article reports official confirmation from the victim, a named security firm investigation, a government agency advisory, or a vendor advisory — set confidence to "confirmed"
   - Otherwise set confidence to "reported"
4. The SUMMARY must carry attribution discipline in its own wording. Write "X claims Y exfiltrated N records" not "Y exfiltrated N records from X". Never flatten claims into confirmations in the summary.
5. Use the exact name as it appears in the article for every entity. Aliases are resolved downstream; do not normalize.
6. If a field is not stated or directly implied, use null. Do not guess.

**Chunking (from arxiv 2407.13093).** If the article body exceeds 1500 words, the pipeline code will chunk it into paragraphs, call this pattern per-chunk, and merge results downstream. When you see `CHUNK_INDEX` and `TOTAL_CHUNKS` in the input, extract only what this specific chunk supports. Merging logic lives in the pipeline, not in your output.

<article>
URL: {url}
SOURCE: {source}
PUBLISHED: {published_at}
CHUNK_INDEX: {chunk_index}
TOTAL_CHUNKS: {total_chunks}
BODY:
{raw_text}
</article>

Output JSON only, matching this schema exactly:

{
  "title": string,
  "summary": string,
  "victim_orgs_confirmed": [string],
  "orgs_mentioned": [string],
  "threat_actors_attributed": [string],
  "actors_mentioned": [string],
  "cves": [string],
  "initial_access_vector": string | null,
  "ttps": [string],
  "impact": {
    "affected_count": number | null,
    "affected_count_unit": string | null,
    "data_exfil_size": string | null,
    "sector": string | null,
    "geographic_scope": string | null,
    "service_disruption": string | null
  },
  "incident_date": string | null,
  "confidence": "claim" | "reported" | "confirmed",
  "claim_markers_observed": [string],
  "primary_source": "article_itself" | "cited_vendor_advisory" | "cited_gov_advisory" | "cited_security_firm" | "aggregated"
}
```

### 10.3 Fact-check (claim support)

```
You are verifying that a structured extraction is supported by its source article. You check three things: field-level support, attribution discipline, and relationship fidelity.

<article>
{raw_text}
</article>

<extraction>
{extraction_json}
</extraction>

**Check 1 — Field support.** For each non-null factual field in the extraction, classify:

- SUPPORTED: The value is directly stated or clearly implied by the article.
- UNSUPPORTED: The value appears nowhere in the article, or contradicts the article.
- OVERREACH: The value is present, but more confident than the article warrants. Examples:
  - confidence is "confirmed" but the article contains claim markers
  - summary omits attribution discipline the article uses
  - affected_count is stated as fact when article presents it as a claim

**Check 2 — Relationship fidelity (from arxiv 2509.23573 §1.1: co-mention bias).** For every (actor, victim) pair in the extraction — every actor in `threat_actors_attributed` paired with every victim in `victim_orgs_confirmed` — find a specific sentence in the article that explicitly links them. If the article mentions both but never links them directly, that's a RELATIONSHIP_UNSUPPORTED issue. Example:
- OK: "ShinyHunters hit Cisco with a breach exposing..." — explicit link
- NOT OK: "Cisco was breached this week. Separately, ShinyHunters published a list of victims." — co-mention, not linked

**Check 3 — Summary attribution discipline.** The `summary` field must preserve claim language from the article. If the article says "X claims Y" and the summary says "X did Y", that's an OVERREACH. If the article uses "allegedly" / "reportedly" / "unverified" for a claim, the summary must use equivalent hedging.

Rules:
- Ignore `claim_markers_observed`, `primary_source`, `orgs_mentioned`, `actors_mentioned` — these are reporting metadata, not factual claims.
- A value is SUPPORTED if any paraphrase or close restatement appears in the article.
- Be strict on OVERREACH around confidence, summary wording, and relationship links. These are the most common failure modes.

Output JSON only:

{
  "overall": "pass" | "fail",
  "issues": [
    {
      "field": string,
      "verdict": "UNSUPPORTED" | "OVERREACH" | "RELATIONSHIP_UNSUPPORTED",
      "article_evidence": string | null,
      "detail": string
    }
  ]
}

Return "pass" only if issues is empty. Pipeline behavior: on any OVERREACH or RELATIONSHIP_UNSUPPORTED verdict, the pipeline will re-run extract once and reconcile (from arxiv 2407.13093 voting pattern). If the second run agrees with the original, the article is published with confidence downgraded. If the runs disagree on the flagged fields, the article is logged as `factcheck_failed` and not published.
```

### 10.4 Investigation agent (Sonnet, with tools)

This pattern runs inside the Claude Code Routine (§11.3) with Brave Search, Playwright, Turso read-only, and NVD/KEV tools. It uses a **named five-phase algorithm** — OBSERVE → PLAN → FETCH → VERIFY → SYNTHESIZE — adapted from Daniel Miessler's PAI Algorithm. Phase names are structural: the agent announces each phase transition, and the trace is diagnosable by phase.

```
You are an investigative cybersecurity analyst researching a specific incident. You produce an evidence-backed deep-dive for one reader (the system owner, a cybersecurity professional). Accuracy and attribution discipline matter more than volume.

You have tools:
- brave_search(query): open-web search. Use 3–8 queries across your investigation.
- fetch_url(url): retrieve and parse a URL. Use on primary sources, vendor advisories, and corroborating articles.
- query_incidents(filter_json): search the local database for related incidents by actor, victim, CVE, or date range.
- get_cve(cve_id): fetch NVD + CISA KEV for a CVE.
- get_actor_profile(name_or_alias): retrieve MITRE ATT&CK data and local entity YAML data for an actor.

You receive the triggering incident's extraction JSON and the full article text of source zero.

# The Five-Phase Investigation Algorithm

Announce each phase transition in your trace ("Entering OBSERVE phase", etc.). Do not skip phases or merge them.

## Phase 1 — OBSERVE

Read source zero fully. Identify:
- The specific factual claims that make this incident novel or significant.
- The attribution claims and their confidence level in the source (claim / reported / confirmed).
- The entities that need cross-checking (victim orgs, actors, CVEs, vendor advisories referenced).

Produce **Ideal State Criteria (ISC)** — a numbered list of binary, testable conditions that must be true before SYNTHESIZE runs. Standard ISC for an investigation:

1. At least 3 corroborating sources fetched (not search snippets, full fetches).
2. At least 1 source is tier-1 investigative or government-advisory level.
3. Every CVE referenced in source zero is cross-checked against NVD + CISA KEV.
4. Every actor named is resolved against MITRE ATT&CK and local entity YAML.
5. For each (actor, victim) pair, a specific source sentence linking them has been recorded.
6. Every evidence source has both `fetched_at` and `source_published_at` recorded.
7. Temporal consistency checked: if evidence spans >12 months, that gap is noted.
8. At least one attempt at fetching the victim's own statement was made (even if unsuccessful).
9. No claim-language markers from sources have been flattened to confirmations.

These ISC are the VERIFY phase's pass/fail gate. Add incident-specific ISC as warranted.

## Phase 2 — PLAN

Order the tool calls. Don't just run queries — plan them. Typical order:

1. Victim's own statement (search for "[victim_org] statement" / "[victim_org] SEC 8-K" / "[victim_org] incident response")
2. Government or agency advisories (CISA KEV if CVEs, FBI alerts, CERT advisories)
3. Named security firm investigations (Unit 42, Mandiant/GTIG, Talos, Microsoft, Crowdstrike)
4. Tier-1 journalism (Krebs, The Record, Risky Biz)
5. Tier-2 journalism for breadth, not as primary (BleepingComputer, Dark Reading, SecurityWeek)

If the source zero is already tier-1 (e.g., a Krebs scoop), don't duplicate the tier-1 search — prioritize finding authoritative confirmation instead.

## Phase 3 — FETCH

Execute the plan. Fetch each source in full; do not rely on search snippets for factual claims. For each vendor advisory referenced, fetch and run the `vendor_doc_review` sub-pattern (§10.5).

Record for each source:
- `url`
- `tier` (tier_1 | tier_2 | vendor_authoritative | gov_advisory | victim_statement)
- `fetched_at` (ISO 8601 timestamp of your fetch)
- `source_published_at` (the article's own published date, from the page)
- `snippet` (the key excerpt supporting a claim)

If the temporal gap between source_published_at values exceeds 12 months, note it — you may be seeing temporally-inconsistent evidence (arxiv 2509.23573 §2.1).

## Phase 4 — VERIFY

This is the culmination of the algorithm. Go through your ISC list one by one. For each criterion, state PASS or FAIL with evidence.

If any ISC item FAILS, either:
(a) loop back to FETCH with a targeted query to close the gap, or
(b) if that gap is unclosable (e.g., no victim statement exists yet), note the failure explicitly in the open questions section of the output.

Also verify:
- **Temporal consistency.** If "current status" claims are being made, is the source recent? If the incident is described as "recent", is the earliest authoritative source within the last 6 months?
- **Alias consistency.** Do MITRE, entity YAML, and MISP agree on the actor's canonical name? If they disagree, note the disagreement rather than silently picking one (arxiv 2509.23573 §2.4).

Do not proceed to SYNTHESIZE until VERIFY has produced an explicit pass/fail per ISC item.

## Phase 5 — SYNTHESIZE

Write the markdown report. Attribution discipline (non-negotiable):

- "X did Y" is a confirmed fact attested by X themselves or by a named independent investigation.
- "X claims Y" is an assertion by X without independent verification.
- "X (attributed to Y by Z)" is Z's attribution of X to Y.
- "Reports indicate" is aggregator-level claim without a named attestor.
- NEVER flatten claims into confirmations.
- EXPLICITLY note what you could not verify.

Output a single markdown document with these sections in order:

## Summary
3–4 sentences. Full attribution discipline. What happened, who says so, with what confidence.

## Timeline
Dated bullet list. Each entry attested by a specific source.

## Attribution
Who. With what confidence. Based on what evidence. Who made the attribution and when. Include relevant actor history and known aliases.

## Technical details
Initial access, TTPs (with MITRE IDs if established), CVEs exploited (with CVSS and KEV status), affected systems, data classes exfiltrated. Use vendor advisory data where available.

## Victim impact
Stated impact. Corroborated vs claimed. Downstream effects if reported.

## Campaign context
Is this part of a larger pattern? Cite related incidents from the local database. Name the campaign if one is already tracked. If not, note whether this looks like a new pattern or a one-off.

## Open questions and unverified claims
Explicit list of things stated by sources but not independently verified, and things you could not establish. Include any ISC items that failed in VERIFY.

## Sources
Numbered list. Each entry: [n] Publication — Title — URL — accessed date — source published date.

Every factual sentence in the body ends with a bracketed source number: [3]. If a sentence is a claim (not confirmed), it reads: "ShinyHunters claims 4 TB exfil [3]." Never drop the claim language even when the source is cited.

When you are done, your LAST output line must be a JSON block on its own line:
```json
{"cost_budget_remaining": <number>, "sources_fetched": <count>, "confidence_overall": "high" | "medium" | "low"}
```

Stop when you have 3–5 corroborated sources OR when your budget_remaining drops below 0.1. Do not continue past that point.
```

### 10.5 Vendor doc review (sub-prompt, invoked from within investigation)

```
You are extracting structured data from a vendor security advisory or bulletin. These are authoritative primary sources for vulnerabilities and are weighted higher than secondary reporting.

Extract exactly what the document states. Do not infer, do not compare against your training data, do not guess at missing fields. If the document is ambiguous, use null.

<document>
URL: {url}
VENDOR: {vendor_if_known}
BODY:
{document_text}
</document>

Output JSON only:

{
  "vendor": string,
  "product": string,
  "advisory_id": string | null,
  "advisory_url": string,
  "cves": [string],
  "cvss_scores": [
    {
      "cve": string,
      "version": "2.0" | "3.0" | "3.1" | "4.0",
      "score": number,
      "severity": "none" | "low" | "medium" | "high" | "critical",
      "vector": string
    }
  ],
  "affected_versions": [string],
  "fixed_versions": [string],
  "exploitation_status": "none_observed" | "proof_of_concept" | "in_the_wild" | "under_active_exploitation" | "unknown",
  "kev_listed": boolean | null,
  "disclosure_date": string | null,
  "patch_released_date": string | null,
  "mitigation_available": boolean,
  "mitigation_summary": string | null,
  "workaround_summary": string | null,
  "attack_complexity": "low" | "high" | null,
  "attack_vector": "network" | "adjacent" | "local" | "physical" | null,
  "requires_user_interaction": boolean | null,
  "requires_authentication": "none" | "low" | "high" | null,
  "scope_changed": boolean | null,
  "credit": [string],
  "notes": string | null
}
```

### 10.6 Optional weekly personal digest (if desired, deferred to v2)

```
You are producing a weekly personal intelligence digest from a set of recent cybersecurity incidents. The audience is one reader — a cybersecurity professional who already knows the field. Write for someone who wants the shape of the week, not recaps.

You receive the closed incidents from the past 7 days as JSON.

Your job:

1. Identify 2–4 clusters or through-lines across the week. A cluster is a set of incidents connected by actor, campaign, target class, vector, or theme.
2. Call out genuinely novel developments: new actor, new TTP, new target class, unusual attribution, first-of-kind event.
3. Flag incidents that seem under-reported relative to their significance.
4. Surface 1–2 unresolved incidents worth watching next week.

Structure:

### The week in one paragraph
One paragraph, no bullets. What the week was about. Lead with the most consequential pattern, not the most-covered story.

### Clusters
One paragraph per cluster. Name the cluster. Connect the dots. Strict attribution discipline.

### Genuinely new
Short list. One line each. Only include items that are genuinely new patterns, not "first time this specific victim was hit."

### Watchlist
Short list. One line each. Things actively unresolved going into next week.

Rules:
- Strict attribution discipline throughout. "Claims" vs "confirmed" vs "attributed."
- No victim-blaming.
- No vendor marketing language.
- No filler: no "overall", "in conclusion", "all in all".
- If a pattern is weak or anecdotal, say so.
- If the week was quiet, say that instead of inflating it.
```

## 11. Discord Integration

### 11.1 `#cyber-news` — embed format

Posted via webhook. One embed per published incident.

```
🟢 Stryker wiper attack: 200k devices wiped across 79 countries
Actor: Handala (attr. Void Manticore / MOIS)
Claims: ~50TB exfil pre-wipe • Confirmed: mass Intune wipe
Sources: Krebs on Security, CyberSecurity Dive, HIPAA Journal • 🟢 6 corroborating
CVEs: none • Access: Entra/Intune Global Admin provisioning
Incident date: 2026-03-11 • Confidence: confirmed
[Read source]
```

- Confidence color dot: 🟢 confirmed, 🟡 reported, 🔴 claim
- Corroboration dot: 🟢 3+ sources, 🟡 2 sources, 🔴 single source
- `incident_id` stored as part of the embed footer for on-demand investigation dispatch

### 11.2 `#cyber-investigations` — thread format

Triggered via `workflow_dispatch` (v1) or reaction-poll (v2). Parent message:

```
🔍 Investigation: Stryker wiper attack
Status: In progress • Started 12:04 UTC
Running: Sonnet agent with Brave Search + Playwright fetch
```

Thread reply (on completion): full markdown body from prompt 10.4. Evidence bundle posted as a JSON file attachment.

### 11.3 Investigation Routine definition

Committed to the repo at `routines/investigate.yaml` and deployed to Anthropic via `claude routine deploy`. The GH Actions workflow references it by name.

```yaml
name: cyber-investigation
description: |
  Deep-dive investigation of a single cybersecurity incident. Produces an
  evidence-backed markdown report with strict attribution discipline,
  3-5 corroborating sources, vendor advisory extraction, and MITRE/KEV
  enrichment.

model: claude-sonnet-4-6

trigger:
  api: true   # invoked programmatically from GH Actions workflow

input_schema:
  type: object
  required: [incident_id, source_zero_url, extraction_json, raw_text]
  properties:
    incident_id: { type: string }
    source_zero_url: { type: string }
    extraction_json: { type: object }
    raw_text: { type: string }
    turso_readonly_token: { type: string }

environment:
  # Sandboxed container; Anthropic-managed. Network egress allowlisted below.
  packages:
    - curl
    - jq
  network_allowlist:
    - "*.anthropic.com"
    - "api.search.brave.com"
    - "services.nvd.nist.gov"
    - "www.cisa.gov"
    - "attack.mitre.org"
    # vendor PSIRTs
    - "msrc.microsoft.com"
    - "sec.cloudapps.cisco.com"
    - "security.paloaltonetworks.com"
    - "*.talosintelligence.com"
    # tier-1 reporting
    - "krebsonsecurity.com"
    - "therecord.media"
    - "news.risky.biz"
    - "www.bleepingcomputer.com"
    - "www.darkreading.com"
    - "www.securityweek.com"
    # Turso for local DB reads (scoped token, read-only)
    - "*.turso.io"

mcp_servers:
  - name: brave-search
    command: npx
    args: ["-y", "@modelcontextprotocol/server-brave-search"]
    env:
      BRAVE_API_KEY: "${secrets.BRAVE_API_KEY}"

  - name: playwright
    command: npx
    args: ["-y", "@playwright/mcp@latest"]

  - name: turso-readonly
    command: npx
    args: ["-y", "@libsql/mcp-server"]
    env:
      TURSO_DATABASE_URL: "${input.turso_readonly_token}"
      TURSO_READ_ONLY: "true"

tools:
  - web_search   # built-in
  - bash         # for curl/jq against NVD, CISA, MITRE
  - file_write   # for writing evidence bundle

system_prompt: |
  # [Contents of prompt 10.4 from this PRD]
  # [Plus vendor_doc_review sub-task contract from prompt 10.5]

output_schema:
  type: object
  required: [markdown, evidence, confidence_overall]
  properties:
    markdown:
      type: string
      description: Full investigation report per section structure in prompt 10.4
    evidence:
      type: array
      items:
        type: object
        required: [url, tier, fetched_at, snippet]
        properties:
          url: { type: string }
          tier: { enum: ["tier_1", "tier_2", "vendor_authoritative", "gov_advisory", "victim_statement"] }
          fetched_at: { type: string, format: date-time }
          snippet: { type: string }
    confidence_overall: { enum: ["high", "medium", "low"] }
    sources_fetched: { type: integer }
    cost_usd_tokens: { type: number }

limits:
  max_session_minutes: 15        # hard cap per investigation
  max_tool_calls: 40
  cost_cap_usd: 1.50             # abort and return partial if exceeded

on_completion:
  # Structured output returned to the caller; GH Actions posts to Discord
  return: output_schema

on_error:
  return_partial: true
  include_error_in_output: true
```

The GH Actions workflow that invokes this:

```yaml
# .github/workflows/investigate.yml (skeleton)
name: Investigate Incident
on:
  workflow_dispatch:
    inputs:
      incident_id:
        description: "Incident ID to investigate"
        required: true
jobs:
  investigate:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4

      - name: Load incident from Turso
        id: load
        run: |
          # Fetch source-zero article + extraction by incident_id
          # Export as env vars for next step
        env:
          TURSO_DATABASE_URL: ${{ secrets.TURSO_DATABASE_URL }}
          TURSO_AUTH_TOKEN: ${{ secrets.TURSO_AUTH_TOKEN }}

      - name: Invoke investigation routine
        id: investigate
        run: |
          curl -sS https://api.anthropic.com/v1/routines/cyber-investigation/invoke \
            -H "x-api-key: $ANTHROPIC_API_KEY" \
            -H "anthropic-beta: managed-agents-2026-04-01" \
            -H "content-type: application/json" \
            -d @- <<EOF > result.json
          {
            "input": {
              "incident_id": "${{ github.event.inputs.incident_id }}",
              "source_zero_url": "${{ steps.load.outputs.url }}",
              "extraction_json": ${{ steps.load.outputs.extraction }},
              "raw_text": ${{ steps.load.outputs.raw_text }},
              "turso_readonly_token": "$TURSO_RO_TOKEN"
            }
          }
          EOF
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TURSO_RO_TOKEN: ${{ secrets.TURSO_READONLY_TOKEN }}

      - name: Post to Discord + persist
        run: |
          # Extract markdown from result.json
          # Write to logs/investigations/${INCIDENT_ID}.md
          # Post parent message + thread reply to Discord webhook
          # Upload evidence bundle as JSON attachment
          # Update Turso investigations table + incidents.investigation_status = 'complete'
          # Commit logs/ back to repo
```

The Turso read-only token is separate from the read-write token used by the ingest workflow. Least-privilege: the Routine can read incidents and entity_aliases for context, but cannot write.

## 12. Models

Kept open. Suggested starting points, all swappable:

- **Triage + extraction + fact-check:** Haiku-class (Claude Haiku, Gemini Flash Lite, or GPT-4.1 mini). Prioritize cost + throughput. Quality threshold is "95%+ correct structured JSON matching schema on valid input."
- **Investigation agent:** Sonnet-class (Claude Sonnet or Claude Opus). Prioritize reasoning + tool-use reliability. This is where quality matters most.
- **Synthesis (if built):** Sonnet-class minimum. Opus-class if weekly output will be archived.

Model choices are config, not code. Set via env vars:

```
MODEL_TRIAGE=claude-haiku-4-5
MODEL_EXTRACTION=claude-haiku-4-5
MODEL_FACTCHECK=claude-haiku-4-5
MODEL_INVESTIGATION=claude-sonnet-4-6
MODEL_SYNTHESIS=claude-sonnet-4-6
```

Reserve the right to swap providers per-stage if cost or quality drifts.

## 13. Cost Estimate

Personal volume assumption: 150 articles/day ingested, ~60 pass pre-filter, ~30 pass triage, ~25 reach publication. ~5 investigations/week.

| Stage | Calls/mo | Avg tokens in | Avg tokens out | Model | ~$/mo |
|---|---|---|---|---|---|
| Triage | ~1800 | 2500 | 150 | Haiku | $1.50 |
| Extraction | ~900 | 6000 | 600 | Haiku | $2.50 |
| Fact-check | ~900 | 7000 | 200 | Haiku | $2.00 |
| Investigation tokens | ~20 | 40000 | 8000 | Sonnet | $5.00 |
| Investigation runtime | ~20 × ~5 min | — | — | Routine @ $0.08/hr | $0.15 |
| Brave search | ~2000 | — | — | free tier | $0 |
| GH Actions | ~1500 min | — | — | free tier | $0 |
| Turso | trivial | — | — | free tier | $0 |

**Estimated total: ~$11/month.** Well within the $15 cap. Synthesis (v2) would add ~$2–4/month.

## 14. Build Phases

### Phase 1 — one weekend

- GH repo scaffold, TypeScript, `@anthropic-ai/sdk`, `rss-parser`, `@mozilla/readability`, `rapidfuzz`, `better-sqlite3` (for local dev) + `@libsql/client` (for Turso in prod).
- Turso database provisioned, schema applied.
- Entity YAML hand-seeded from Ringmast4r piece (section 9).
- Scheduled GH Actions workflow `ingest.yml`: every 30 min, ingest + dedup + pre-filter. No LLM yet.
- Let it run for 24h. Inspect `articles` table. Confirm volume and source quality.

### Phase 2 — a few evenings

- Triage + extraction + fact-check stages, all Haiku.
- Discord webhook to `#cyber-news`.
- Ship it. Watch the channel for a few days. Tune prompts based on failure modes in the logs.

### Phase 3 — a weekend

- Define the investigation Routine (`routines/investigate.yaml`, section 11.3), commit to repo.
- Deploy the Routine to Anthropic via the Claude CLI (`claude routine deploy`).
- Investigation workflow (`investigate.yml`), `workflow_dispatch` triggered on `incident_id`.
- Workflow fetches source-zero and extraction from Turso, invokes the Routine via the Anthropic API with `managed-agents-2026-04-01` beta header, streams progress, writes the draft to `logs/investigations/{incident_id}.md`, and posts to Discord thread.

### Phase 4 — optional polish

- Discord reaction polling for investigation trigger (no CF Worker needed).
- Weekly synthesis workflow.
- Cloudflare Worker for proper `/investigate` slash command.
- Email ingestion path for newsletter-only sources.

Do not start Phase 4 until Phases 1–3 have been running for at least two weeks and the system feels boring.

## 15. Open Questions

- **Turso vs. committed SQLite-in-repo?** Turso gives a proper database with concurrent access and cross-workflow consistency. Committing a SQLite file to git works but is ugly at scale. Default to Turso.
- **How much to budget for investigation backfill on launch?** If seeding against a month of existing articles, investigation cost can spike. Cap at 10 investigations in the first run.
- **MITRE ATT&CK refresh cadence?** Quarterly is probably fine for personal use. Manual.
- **What happens when a source RSS dies?** Add heartbeat check: if a source produced zero articles in 7 days, log a warning. Don't auto-remove.
- **How to handle breaking news where single-source is the only source?** Current design publishes single-source with a 🔴 corroboration dot. This is correct. Breaking news is valuable precisely because it is early.

## 16. Operational Notes

- All secrets in GH Actions repo secrets: `ANTHROPIC_API_KEY`, `BRAVE_API_KEY`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `DISCORD_WEBHOOK_NEWS`, `DISCORD_WEBHOOK_INVESTIGATIONS`.
- Every workflow run logs a JSONL entry to `logs/runs/{YYYY-MM-DD}.jsonl` in the repo. Committed on workflow completion via simple `git add` step.
- Entity YAML changes are human-committed only. Never auto-updated by workflow.
- Budget alarms: if monthly API spend exceeds $20, an Action emits a warning to Discord. Hard cap at $30 via API key usage limits in the Anthropic console.

### 16.1 Known LLM-CTI failure modes (reference for maintainers)

From arxiv 2509.23573, the three cognitive failure classes that hit LLM-based CTI pipelines:

1. **Spurious correlations from superficial metadata** — co-mention bias, exploitation bias from reused IoCs, source skew. Defense in this PRD: split `victim_orgs_confirmed` vs `orgs_mentioned`; relationship-fidelity check in fact-check pattern.
2. **Contradictory knowledge from conflicting sources** — temporal contradictions, semantic conflicts (same name, different referents), divergent taxonomies across platforms. Defense: evidence bundle records `source_published_at` alongside `fetched_at`; investigation VERIFY phase explicitly checks temporal consistency and flags cross-platform alias disagreements.
3. **Constrained generalization to emerging threats** — distributional bias, environmental unawareness. Defense: the entity YAML. Weekly maintenance of the YAML is the single highest-leverage quality lever in the system.

If a failure slips through and gets published, root-cause it against this taxonomy. The fix is almost always either (a) a YAML update, or (b) a new check in the fact-check pattern.

## 17. Reading List

The reference set that informed the current PRD design. Useful for future-you or anyone inheriting this project.

**Architectural / design influences:**

- [Fabric](https://github.com/danielmiessler/fabric) — Daniel Miessler. The Pattern abstraction used in §10. Specifically see `patterns/analyze_threat_report`, `patterns/create_security_update`, `patterns/create_sigma_rules`, `patterns/extract_wisdom`. ~300 contributors, MIT-licensed.
- [Personal AI Infrastructure (PAI)](https://danielmiessler.com/blog/personal-ai-infrastructure) — Daniel Miessler. The source of the named-phase algorithm (OBSERVE → PLAN → FETCH → VERIFY → SYNTHESIZE in our case), the Ideal State Criteria (ISC) concept, and the three-tier memory model (Session / Work / Learning). PAI itself is much larger in scope than our project; we borrow architecture, not code.
- [PAI repository](https://github.com/danielmiessler/PAI) — the actual codebase, useful if you want to see how ISC and hooks are implemented in practice.

**Empirical / research references:**

- [arxiv 2509.23573 — "Uncovering Vulnerabilities of LLM-Assisted Cyber Threat Intelligence"](https://arxiv.org/abs/2509.23573) (Meng et al, Sep 2025; rev3 Feb 2026). The taxonomy of CTI-specific LLM failure modes. Read this before tuning any pattern prompt. The co-mention bias section (§1.1) directly drove the extraction schema split; §2.1 (temporal contradiction) drove the evidence-bundle dating requirement.
- [arxiv 2407.13093 — "Using LLMs to Automate Threat Intelligence Analysis Workflows in SOCs"](https://arxiv.org/abs/2407.13093) (Tseng et al, Jul 2024). Source of the chunk-vote-purify pattern. Their focus is IOC extraction and Sigma rule generation, not ours, but the voting approach adapts cleanly to our fact-check re-run logic.

**Adjacent but optional:**

- [arxiv 2407.05194 — LLMCloudHunter](https://arxiv.org/abs/2407.05194) — multi-stage LLM pipeline for cloud CTI, 99%/98% precision/recall on IoC extraction. Relevant if we ever add Sigma rule output.
- Miessler's [Personal AI Maturity Model](https://danielmiessler.com/blog/personal-ai-maturity-model) — framework for thinking about where on the assistant-capability ladder a system sits.
- [Unsupervised Learning newsletter](https://newsletter.danielmiessler.com/) — Miessler's ongoing writing. The attribution discipline and observational voice in the investigation pattern's output are informed by both UL and the Ringmast4r piece that originally motivated this project.

**Cultural / voice references (for when synthesis stage is turned on):**

- Ringmast4r's ["We May Be Living Through the Most Consequential Hundred Days in Cyber History"](https://ringmast4r.substack.com/p/we-may-be-living-through-the-most) — the originating model for what good weekly synthesis looks like. Strict claim-vs-confirmed discipline, campaign-level connection of disparate incidents, willingness to name the thing nobody else is naming.

---

*End of PRD.*
