# Cyber-news dissector — project board

PM session board. This file is the canonical backlog (not GitHub Issues).
Active items are specced enough to dispatch to a cloud coding agent
without follow-up questions; pending items have explicit re-evaluation
triggers.

## Status at a glance

| # | Goal | Item | Status | Re-eval / blocker |
|---|---|---|---|---|
| 1 | Publish quality | Triage `reason_code` enum | active, dispatch-ready | — |
| 2 | Publish quality | Non-title `pattern_schema_invalid` | pending-data | 2026-05-18, non-title schema-invalid event |
| 3 | Dedup quality | Dedup-decision telemetry | active, dispatch-ready | — |
| 4 | Dedup quality | Low-trust source tier | active, dispatch-ready | — |
| 5 | Dedup quality | Publish-delay queue + corroboration batching | pending-data | 2026-05-18, after #3 produces near-miss + corroboration histograms |

Dispatch sequencing: #1, #3, #4 are independent — dispatch in parallel
when ready. #2 and #5 wait for triggers.

---

# Goal 1 — Publish quality

Raise publish rate; fail for the right reasons. Latest process run
`2b1452a0` (2026-05-11): 11 processed → 3 published, 5 triage_rejected,
3 factcheck_failed.

## Item 1 — Triage `reason_code` enum

**Active. Dispatch-ready.** Latest process run shows **5
`triage_unhandled`** failures — the keyword-fallback bucket in
`mapTriageReason` that hides the real reject reasons. Tightening the
enum surfaces what triage is actually filtering.

### Files to modify

| File | Change |
|---|---|
| `patterns/triage/schema.json` | Add `reason_code` (required, enum). |
| `patterns/triage/pattern.md` | Document the enum values for the model with one-line semantics each. |
| `src/pipeline/failure_codes.ts` | Replace `mapTriageReason`'s keyword matcher (lines 42–69) with a direct enum-to-FailureCode map. Unknown values still fall to `triage_unhandled` as defensive default; the production path should stop needing it. |
| `tests/patterns/triage/` fixtures | Add one fixture per enum value, or update existing fixtures to emit `reason_code`. |

### Enum sourcing — do this first

Don't invent the enum. Bucket the `reason` field across recent
`triage_rejected` events in `logs/runs/2026-05-1*/process-*.ndjson` and
collapse synonyms. Likely candidates from the existing keyword matcher:
`vendor_marketing`, `not_an_incident`, `off_topic`, `speculation`,
`low_severity`. Anything currently in `triage_unhandled` is signal the
enum is incomplete.

### Acceptance criteria

- `npm test` + `npm run typecheck` clean.
- `triage_unhandled` events drop to ≤1/run in the next 24 h of process runs.
- Any residual `triage_unhandled` represents a true model output the enum
  doesn't cover — log and decide enum-vs-accept per case.

### Out of scope

- Re-prompting triage to be more specific (separate concern).
- Changing what gets rejected vs. passed — categorization change only.

## Item 2 — Non-title `pattern_schema_invalid` investigation

**Pending data.** Pre-#20 (2026-05-10) emitted 24 `pattern_schema_invalid`
events: 8 on `$.title` (fixed by #20) and 16 on other fields. Post-#20
(2026-05-11) emitted **0**. One day is not enough to know whether the
non-title failures were a one-off.

**Re-evaluation trigger:** any process run after **2026-05-18** that
emits `pattern_schema_invalid` events *not* on `$.title`. Until then, no
spec — the field has to tell us.

When triggered, the decision per offending field mirrors #20: nullable in
schema (legitimate gap) vs. pipeline fallback (value available elsewhere).

---

# Goal 2 — Dedup & corroboration quality

One Discord post per story, with rich corroboration. Today's failure
mode: production `titleRatio` (rapidfuzz Indel ratio, threshold 85)
scores aggressively-reworded same-story headlines at **60–65** and lets
both pass through as separate Discord posts. Cross-source publish lag is
mostly hours, not days — the 7-day dedup window is generous; the metric
is the bottleneck. (Cross-source title-similarity analysis run
2026-05-11: 6 plausible duplicates in 14 d of feed retention, all scored
60–65, none caught.)

## Item 3 — Dedup-decision telemetry

**Active. Dispatch-ready. Ship first in Goal 2.** Today the system
silently fails to catch fuzzy duplicates: `matchScore` is computed in
`findDuplicate` and thrown away (`src/ingest/dedup.ts:67-92`),
near-misses don't appear in any log. We can't size a delay window or
evaluate a richer metric without this data. Pure observability — no
behavior change.

### Files to modify

| File | Change |
|---|---|
| `src/ingest/run.ts` (~line 85, inside `runIngestForSource`) | After `findDuplicate` returns, emit a `dedup_decision` event with `{candidate_article_id, candidate_source_id, candidate_source_tier, candidate_published_at, top_match_id, top_match_score, decision, reason}`. Always emit — duplicate OR unique. |
| `src/ingest/dedup.ts` | Modify `findDuplicate` to also return the **best non-matching** score (top score below threshold) so unique decisions carry that signal. Add a `top_score` field to `DedupResult` alongside `matchScore`. |
| `src/pipeline/process.ts` (the corroboration-bump path referenced at `process.ts:458`) | Emit an `incident_corroborated` event when a duplicate dedup hit bumps an existing incident's count: `{incident_id, corroborator_article_id, corroborator_source_id, time_since_first_publish_ms, corroboration_count_after, dedup_reason}`. |
| `scripts/mcp_run_log.ts` | Add a `runlog_dedup_histogram` tool: scans `dedup_decision` events over a window and returns score-bucket counts + sample titles. Mirror the shape of `runlog_recent_health`. |

### Event schema

```jsonc
// dedup_decision — every ingest dedup call
{
  "schema_version": 1, "stage": "ingest",
  "event": "dedup_decision",
  "candidate": { "article_id": "…", "source_id": "…", "source_tier": "…", "published_at": "…", "title": "…" },
  "decision": "duplicate" | "unique",
  "reason": "url_match" | "title_match" | "no_match",
  "top_match": { "article_id": "…", "score": 72 } | null
}

// incident_corroborated — when a duplicate bumps corroboration
{
  "schema_version": 1, "stage": "ingest",
  "event": "incident_corroborated",
  "incident_id": "…", "corroborator_article_id": "…",
  "corroborator_source_id": "…", "corroborator_source_tier": "…",
  "time_since_first_publish_ms": 14523000,
  "corroboration_count_after": 3,
  "dedup_reason": "url_match" | "title_match"
}
```

### Acceptance criteria

- `npm test` + `npm run typecheck` clean.
- Run-log evidence after merge: next ingest run emits `dedup_decision`
  for every candidate (count matches `fetched - errors` per source).
- `runlog_dedup_histogram` returns a populated score distribution from a
  one-day window.

### Out of scope

- Changing the dedup threshold or metric — pure observability.
- Persisting `matchScore` to the DB (events are sufficient for now).
- Computing alternative similarity metrics — that's the next item if
  data warrants.

## Item 4 — Low-trust source tier

**Active. Dispatch-ready.** User wants a facility to onboard new sources
at lower confidence and let the pre-filter be stricter on them, so
new-source signal/noise can be assessed without polluting Discord. Today
`tier` exists in `src/ingest/sources.ts` (`primary | secondary |
aggregator | vendor`) and is used in pre-filter scoring, but there's no
explicit "experimental / low-trust" tier with stricter thresholds.

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

### Out of scope (deferred to Item 5)

- Using tier as a dedup tiebreak (canonical-URL selection) — needs the
  publish queue to be meaningful.
- Surfacing tier in the Discord embed — same.
- Promotion path from `low_trust` to `secondary` — manual edit to
  `sources.ts` for now; revisit if it becomes a chore.

## Item 5 — Publish-delay queue + corroboration batching

**Pending data.** Architectural: introduce a `pending_publish` state
between `extracted` and `published`. Articles settle for a bounded window
during which (a) richer post-extraction matching can merge same-story
clusters using extracted entities/CVEs/actor/incident_date overlap;
(b) source-tier preference selects the canonical URL; (c) the Discord
embed publishes with the corroboration count and source list correct
at first post. Existing PATCH-on-corroboration becomes the fallback for
the multi-day tail.

**Why deferred:** sizing the settle window requires the corroboration-
arrival distribution (from Item 3), and the design depends on whether
near-miss scores cluster around an actionable threshold (also from Item
3). Building this before the data is available is guessing.

**Re-evaluation trigger:** at least 7 days of `dedup_decision` and
`incident_corroborated` events post-Item-3 merge, **at the earliest
2026-05-18**. At re-eval, answer with data:
1. What's the median / p75 / p90 time-to-2nd-corroboration per incident?
2. Where do near-miss scores cluster (60–69? 70–84? scattered)?
3. How many Discord duplicates per week does the current threshold
   actually let through?

If (1) is <24 h and (3) is non-trivial (≥3/week), spec the queue. If (3)
is negligible, **don't build it** — the current architecture is fine for
a personal tool and the freshness tax isn't worth it.

---

# Recently shipped

- **#19** (`74d9ae0`) — NVD grace period for recent CVEs.
  `cveGraceDays` (default 14) skips `cveExists` for articles within the
  grace window. Evidence: `factcheck_invalid_cve` 5 → 1 in 2026-05-11 runs.
- **#20** (`72427cf`) — RSS title fallback when extract returns null.
  `process.ts:327` coerces `null` titles to `article.title`. Evidence:
  `$.title` `pattern_schema_invalid` events 8 → 0 across the
  2026-05-10 → 2026-05-11 transition.

---

# Future / declined

- **MITRE CVE list as secondary source** — only if #19's grace proves
  insufficient. Current evidence says it's sufficient.
- **Soft-fail CVE** (strip unverified CVEs rather than failing the
  article) — declined. Trades CVE specificity for publish rate.
- **Embedding-based summary reconcile** — only if the 70 threshold from
  #18 lets through quality issues. Reach for with data, not preemptively.
- **Topic-conditioned source preference** (Krebs preferred for crime,
  Ars for crypto, etc.) — declined for now. Needs taxonomy; bad
  value/effort for a personal tool. Revisit if `low_trust` tier proves
  the simple version is genuinely insufficient.
- **Issues vs. TODO.md** — declined to migrate. TODO.md stays canonical
  for backlog; issues only if a stable external URL is needed (rare for
  this project).

---

# Conventions

- One PR per item. Independent code paths ship in parallel.
- Active items must be dispatch-ready (files, change shape, acceptance).
- Pending-data items must carry a re-eval date + measurable trigger.
- Re-evaluate the whole board on each shipped PR.
