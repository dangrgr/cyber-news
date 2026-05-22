# Cyber-news dissector — project board

PM session board. This file is the canonical backlog (not GitHub Issues).
Active items are specced enough to dispatch to a cloud coding agent
without follow-up questions; pending items have explicit re-evaluation
triggers.

## Status at a glance

| # | Goal | Item | Status | Re-eval / blocker |
|---|---|---|---|---|
| 1 | Publish quality | Non-title `pattern_schema_invalid` | pending-data | 2026-05-18, non-title schema-invalid event |
| 2 | Dedup quality | Cross-source dedup architecture (settle window vs. outbound dedup) | pending-data | 2026-05-19, after #23 near-miss histograms + corroboration telemetry sanity check |
| 3 | Dedup quality | Incident-id keying / corroboration starvation (#35) | pending-data | 2026-05-29, ≥1 same-incident pair with diverging `incident_created` keys |

**Project state: observation mode.** All items are pending data; no
dispatch-ready items right now. Items #1 and #2's trigger windows
(2026-05-18 / -19) have opened and are due a data re-eval against current
run logs. The corroboration telemetry sanity check (Item #2's blocker) was
done 2026-05-22: it surfaced an instrumentation gap (fixed in #34) **and**
a keying gap, split out as Item #3 / issue #35. Next dated trigger:
**2026-05-29** (Item #3).

If a candidate feed materializes for the `low_trust` tier (shipped in
#26 as a facility), that's a one-line edit in `src/ingest/sources.ts`
and doesn't require a new board item.

---

# Goal 1 — Publish quality

Raise publish rate; fail for the right reasons. With #19, #20, and #24
shipped, the keyword-fallback bucket (`triage_unhandled`) should drop
to ≤1/run in post-merge process cycles and the `$.title`-shape schema
failures are eliminated. **Evidence pending** the first post-merge cron
cycle (no committed run logs from after 2026-05-12 02:29 UTC yet).

## Item 1 — Non-title `pattern_schema_invalid` investigation

**Pending data.** Pre-#20 (2026-05-10) emitted 24 `pattern_schema_invalid`
events: 8 on `$.title` (fixed by #20) and 16 on other fields. Post-#20
process runs through 2026-05-11 emitted **0**. One day was not enough
to know whether the non-title failures were a one-off.

**Re-evaluation trigger:** any process run after **2026-05-18** that
emits `pattern_schema_invalid` events *not* on `$.title`. Until then,
no spec — the field has to tell us.

When triggered, the decision per offending field mirrors #20: nullable
in schema (legitimate gap) vs. pipeline fallback (value available
elsewhere). Don't pre-design — let the field tell us.

---

# Goal 2 — Dedup & corroboration quality

One Discord post per story, with rich corroboration. With #23, #24,
and #26 shipped, the building blocks for the queue decision are in
place:
- `dedup_decision` events expose near-miss scores (#23).
- `incident_corroborated` events expose cross-source arrival timing (#23).
  Sanity-checked 2026-05-22: the dead-branch bug (fixed in #32) was masking
  the deeper problem that the incident key rarely collides across sources,
  so corroboration almost never fires — split out as Item #3 / issue #35.
  `incident_id` is now in the run log (#34).
- `low_trust` tier provides a safe path to onboard new sources before
  promoting them — relevant if the data shows preferred-source delays
  matter (#26).

Today's failure mode (pre-#23 analysis): production `titleRatio`
(rapidfuzz Indel ratio, threshold 85) scores aggressively-reworded
same-story headlines at **60–65** and lets both pass through as separate
Discord posts. Cross-source publish lag is mostly hours, not days — the
7-day dedup window is generous; the metric is the bottleneck.

## Item 2 — Cross-source dedup architecture

**Pending data.** Two architectural options on the table for catching the
60–65 `titleRatio` misses; the data picks one (or none).

### Option A — Pre-publish settle window

Introduce a `pending_publish` state between `extracted` and `published`.
Articles settle for a bounded window during which (a) richer post-
extraction matching can merge same-story clusters using extracted
entities/CVEs/actor/incident_date overlap; (b) source-tier preference
selects the canonical URL; (c) the Discord embed publishes with the
corroboration count and source list correct at first post. Existing
PATCH-on-corroboration becomes the fallback for the multi-day tail.

- **Cost:** freshness tax = settle window length (hours of delay before
  first publish).
- **LoE:** new state + pending-article storage + drainer/scheduler +
  cluster-merge + canonical selection + publish-path rewrite. Multi-PR.
- **Wins:** canonical-source selection at first post (better source can
  beat a worse first-arriver).

### Option B — Post-publish outbound dedup on extracted fields

Keep ingest-time `titleRatio` for obvious cases. After extraction, run a
second dedup pass against already-published articles in the rolling
window, matching on extracted entities/CVEs/actor/incident_date. On
match → bump corroboration via the existing PATCH path and drop the new
article. On no match → publish as today. Storage: small SQL index of
extracted fields per published article in the existing local SQLite,
queried by the second pass.

- **Cost:** first-arriver wins the canonical Discord slot — a richer
  source arriving 2h later gets merged into the worse first headline
  unless we add an aggressive embed-rewrite on PATCH (fiddly).
  Mitigation: `low_trust` tier (#26) keeps iffy sources from "winning"
  by arriving first.
- **LoE:** SQL index + match scorer + hook into existing PATCH path.
  1–2 PRs.
- **Wins:** no freshness tax; reuses the PATCH path that already exists.

**Corroboration display (B presentation, not a separate option).**
Once B has merged a duplicate, how the corroboration surfaces spans a
spectrum: minimal — enrich the embed PATCH with an "Also reported by"
sources field (webhook-only, no new auth, no channel change); maximal —
thread-append each corroboration as its own message under the first
post (needs a forum channel or a bot token, since the project is
webhook-only today). Pick the point on that spectrum when B is specced
post-re-eval; the minimal end is the safe default.

### Shared unknown

Both options need the same multi-field match scorer over
entities/CVEs/actor/incident_date — that's the interesting work in
either case. A wraps it in a queue; B wraps it in an outbound check.

**Why deferred:** sizing either option requires two separate signals:
near-miss score distribution from `dedup_decision`, and second-source
arrival timing from `incident_corroborated` or an explicit substitute.
The first signal is flowing. The second must be sanity-checked before
it is treated as evidence. Building before the data path is known-good
is guessing.

**Re-evaluation trigger:** at least **7 days of `dedup_decision`
events post-#23 merge**, earliest **2026-05-19**, plus one
corroboration telemetry sanity check:
- If `incident_corroborated` events are present, use them for timing.
- If they are absent, first determine whether that means no
  corroboration happened or the merge/instrumentation path is not
  emitting. Do not treat zero events as zero corroboration without this
  check.
At re-eval, answer with data:
1. What's the median / p75 / p90 time-to-2nd-corroboration per incident
   (from `incident_corroborated` if populated; otherwise mark blocked
   and spec a small telemetry/merge fix before architecture work)?
2. Where do near-miss scores cluster (60–69? 70–84? scattered) — query
   via `runlog_dedup_histogram`?
3. How many Discord duplicates per week does the current threshold
   actually let through?

**Decision rules at re-eval:**
- If (3) is negligible, **don't build either** — current architecture is
  fine for a personal tool.
- Otherwise default to **Option B**: lower LoE, no freshness tax, PATCH
  path already exists. Canonical-source-quality is a polish win, not a
  correctness one.
- If corroboration telemetry is blocked, do not choose Option A to
  compensate; fix the merge/instrumentation path or use a manual
  duplicate sample, then revisit.
- Reach for **Option A** only if B ships and source-quality complaints
  emerge (wrong source winning the Discord slot becomes a recurring
  user-visible problem).

## Item 3 — Incident-id keying (corroboration starvation)

**Pending data.** Tracked as GitHub issue #35. This is the outcome of Item
#2's corroboration telemetry sanity check (done 2026-05-22): cross-source
corroboration almost never fires in production — not (only) because of the
dead code path #32 fixed, but because the deterministic incident id rarely
collides across sources, so `incident_corroborated` has nothing to fire on.

`incidentKey()` (`src/pipeline/process.ts`) hashes
`incident_date | victim_orgs_confirmed[0] | threat_actors_attributed[0]`.
For vuln disclosures there is no actor, so the key reduces to `date|victim`
— fragile to "Cisco" vs "Cisco Secure Workload" or one-day date drift.
Observed miss: securityweek + bleepingcomputer on the same Cisco Secure
Workload flaw (shared CVE-2026-20223) → two single-source posts, no PATCH.

**Now debuggable.** #34 added the `incident_created` event logging
`key_date`/`key_victim`/`key_actor` (the exact hash inputs) and put
`incident_id` on the published `article_done`. Diagnose by grepping
`incident_created` for same-victim pairs that landed on different ids.

**Re-evaluation trigger:** first week (earliest **2026-05-29**, ~7 days of
post-#34 cron data) where committed logs show **≥1 same-incident pair with
diverging `incident_created` keys**. Until then, no spec — the key_* values
have to tell us which normalization to apply (victim canonicalization via
`entities.yaml` / CVE-in-key / date bucket / fuzzy fallback).

**Relationship to Item #2:** distinct mechanism (process-time incident
keying vs. ingest-time `titleRatio`), but both serve one-post-per-story.
Fixing the key is lower-LoE and may catch some misses before the dedup
architecture question arises; its data is flowing now, so sequence #35
ahead of Item #2.

---

# Recently shipped

- **#34** (`a1f9a5d`, 2026-05-22) — Incident run-log visibility. `incident_id`
  on the published `article_done`; new `incident_created` event logging the
  hash inputs (`key_date`/`key_victim`/`key_actor`). Pure observability; id
  output unchanged. Makes Item #3 / issue #35 diagnosable from the logs.
- **#33** (`590538b`, 2026-05-21) — CI log-commit race fix. Shared
  `log-commit` concurrency group + push-retry loop across ingest/process/
  investigate workflows, replacing `pull --rebase || true` that swallowed
  rebase conflicts and silently dropped run-log commits on `main` (explains
  the stale local `logs/runs/` seen during the telemetry audit).
- **#32** (`79b784e`, 2026-05-21) — Corroborate on deterministic id match.
  Unified `resolveIncidentId` so a second source on an existing incident
  PATCHes + emits `incident_corroborated`; the prior `if (article.incident_id)`
  branch was dead. Necessary-but-not-sufficient: keys rarely collide → Item #3.
- **#31** (`9fe3b54`, 2026-05-21) — Factcheck prompt/schema alignment.
  Dropped the `SUPPORTED` verdict the schema rejected (3 articles/9d lost to
  `verdict not in enum` parse errors; 2026-05-15/-18/-19). Zero recurrences.
- **#26** (`ab548ca`, 2026-05-12) — Low-trust source tier. Added
  `"low_trust"` to `SourceTier` union; `scorePrefilter` applies a 1.2×
  threshold multiplier for it (single keyword no longer enough to pass
  pre-filter). No source ships at this tier — it's the onboarding
  facility. Documented all tiers in `docs/PRD.md §7.1`.
- **#23** (`7863d69`, 2026-05-12) — Dedup-decision telemetry. Emits
  `dedup_decision` on every ingest dedup call and `incident_corroborated`
  on the process-side corroboration-bump path; adds
  `runlog_dedup_histogram` MCP tool. Pure observability — no behavior
  change. Outputs gate the 2026-05-19 re-eval of Item #2.
- **#24** (`0e4ff19`, 2026-05-12) — Triage `reason_code` enum.
  Tightened `patterns/triage/schema.json` with a required `reason_code`
  enum sourced from real run-log buckets (22/28 prior `triage_unhandled`
  were opinion/commentary → `not_an_incident`). `mapTriageReasonCode`
  replaces the keyword-fallback path. Acceptance bar:
  `triage_unhandled` ≤ 1/run.
- **#20** (`72427cf`, 2026-05-11) — RSS title fallback when extract
  returns null. `process.ts:327` coerces `null` titles to
  `article.title`. Evidence: `$.title` `pattern_schema_invalid` events
  went 8 → 0 across the 2026-05-10 → 2026-05-11 transition.
- **#19** (`74d9ae0`, 2026-05-11) — NVD grace period for recent CVEs.
  `cveGraceDays` (default 14) skips `cveExists` for articles within
  the grace window. Evidence: `factcheck_invalid_cve` 5 → 1 in
  2026-05-11 runs.

---

# Future / declined

- **MITRE CVE list as secondary source** — only if #19's grace proves
  insufficient. Current evidence says it's sufficient.
- **Soft-fail CVE** (strip unverified CVEs rather than failing the
  article) — declined. Trades CVE specificity for publish rate.
- **Embedding-based summary reconcile** — only if the 70 threshold
  from #18 lets through quality issues. Reach for with data, not
  preemptively.
- **Topic-conditioned source preference** (Krebs preferred for crime,
  Ars for crypto, etc.) — declined for now. Needs taxonomy; bad
  value/effort for a personal tool. Revisit if `low_trust` tier proves
  the simple version is genuinely insufficient.
- **Issues vs. TODO.md** — declined to migrate. TODO.md stays canonical
  for backlog; issues only if a stable external URL is needed (rare
  for this project).

---

# Conventions

- One PR per item. Independent code paths ship in parallel.
- Active items must be dispatch-ready (files, change shape, acceptance).
- Pending-data items must carry a re-eval date + measurable trigger.
- Re-evaluate the whole board on each shipped PR.
