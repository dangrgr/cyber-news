# Cyber-news dissector — project board

PM session board. This file is the canonical backlog (not GitHub Issues).
Active items are specced enough to dispatch to a cloud coding agent
without follow-up questions; pending items have explicit re-evaluation
triggers.

## Status at a glance

| # | Goal | Item | Status | Re-eval / blocker |
|---|---|---|---|---|
| 1 | Publish quality | Non-title `pattern_schema_invalid` | pending-data | 2026-05-18, non-title schema-invalid event |
| 2 | Dedup quality | Low-trust source tier | active, dispatch-ready | — |
| 3 | Dedup quality | Publish-delay queue + corroboration batching | pending-data | 2026-05-19, after #23 produces 7d of near-miss + corroboration histograms |

Item #2's PR is expected imminently. Items #1 and #3 are correctly
parked on their triggers.

---

# Goal 1 — Publish quality

Raise publish rate; fail for the right reasons. With #24 merged, the
keyword-fallback bucket (`triage_unhandled`) should drop to ≤1/run in
the next ~24h of process cycles — evidence pending.

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

One Discord post per story, with rich corroboration. With #23 merged,
near-miss scores and corroboration-arrival times are now observable via
`dedup_decision` and `incident_corroborated` events. The data those
events produce gates Item #3 below.

Today's failure mode (pre-#23 analysis): production `titleRatio`
(rapidfuzz Indel ratio, threshold 85) scores aggressively-reworded
same-story headlines at **60–65** and lets both pass through as separate
Discord posts. Cross-source publish lag is mostly hours, not days — the
7-day dedup window is generous; the metric is the bottleneck.

## Item 2 — Low-trust source tier

**Active. Dispatch-ready.** PR expected imminently. Provides a facility
to onboard new sources at a stricter pre-filter threshold, so new-source
signal/noise can be assessed without polluting Discord. Today `tier`
exists in `src/ingest/sources.ts` (`primary | secondary | aggregator |
vendor`) and is used in pre-filter scoring, but there's no explicit
"experimental / low-trust" tier with stricter thresholds.

### Files to modify

| File | Change |
|---|---|
| `src/ingest/sources.ts` | Add `"low_trust"` as a valid tier value in the type. No existing source moves to it yet — this is the new-source onboarding tier. |
| `src/pipeline/prefilter.ts` (or wherever `sourceTier` is consumed in `scorePrefilter`) | When `sourceTier === "low_trust"`, require a higher prefilter score to pass (e.g., +20% threshold or stricter keyword match). Pick a concrete delta; document it. |
| `tests/pipeline/prefilter.test.ts` | Add fixture: same article body at `secondary` passes, at `low_trust` does not. |
| `docs/PRD.md` §7.1 (or wherever source tiers are documented) | Document the new tier and its intent. |

### Acceptance criteria

- `npm test` clean.
- Run-log evidence after merge: any source manually flipped to
  `low_trust` produces visibly higher `pre_filtered` count and lower
  `passed_to_triage` count for the same input volume.

### Out of scope (deferred to Item 3)

- Using tier as a dedup tiebreak (canonical-URL selection) — needs the
  publish queue to be meaningful.
- Surfacing tier in the Discord embed — same.
- Promotion path from `low_trust` to `secondary` — manual edit to
  `sources.ts` for now; revisit if it becomes a chore.

## Item 3 — Publish-delay queue + corroboration batching

**Pending data.** Architectural: introduce a `pending_publish` state
between `extracted` and `published`. Articles settle for a bounded
window during which (a) richer post-extraction matching can merge
same-story clusters using extracted entities/CVEs/actor/incident_date
overlap; (b) source-tier preference selects the canonical URL; (c) the
Discord embed publishes with the corroboration count and source list
correct at first post. Existing PATCH-on-corroboration becomes the
fallback for the multi-day tail.

**Why deferred:** sizing the settle window requires the corroboration-
arrival distribution (now flowing via `incident_corroborated` events
from #23), and the design depends on whether near-miss scores cluster
around an actionable threshold (also from #23's `dedup_decision`
events). Building before the data is in is guessing.

**Re-evaluation trigger:** at least **7 days of `dedup_decision` and
`incident_corroborated` events post-#23 merge**, earliest **2026-05-19**.
At re-eval, answer with data:
1. What's the median / p75 / p90 time-to-2nd-corroboration per incident
   (from `runlog_get_run` + new `incident_corroborated` events)?
2. Where do near-miss scores cluster (60–69? 70–84? scattered) — query
   via `runlog_dedup_histogram`?
3. How many Discord duplicates per week does the current threshold
   actually let through?

If (1) is <24h and (3) is non-trivial (≥3/week), spec the queue. If (3)
is negligible, **don't build it** — the current architecture is fine
for a personal tool and the freshness tax isn't worth it.

---

# Recently shipped

- **#23** (`7863d69`, 2026-05-12) — Dedup-decision telemetry. Emits
  `dedup_decision` on every ingest dedup call and `incident_corroborated`
  on the process-side corroboration-bump path; adds
  `runlog_dedup_histogram` MCP tool for histogramming near-miss scores.
  Pure observability — no behavior change. Evidence pending ~7d of
  production runs; outputs gate the 2026-05-19 re-eval of Item #3.
- **#24** (`0e4ff19`, 2026-05-12) — Triage `reason_code` enum.
  Tightened `patterns/triage/schema.json` with a required `reason_code`
  enum sourced from real run-log buckets (22/28 prior `triage_unhandled`
  were opinion/commentary → `not_an_incident`). `mapTriageReasonCode`
  replaces the keyword-fallback path. Evidence pending next ~24h of
  process runs (acceptance bar: `triage_unhandled` ≤ 1/run).
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
