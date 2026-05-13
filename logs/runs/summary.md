# Run summary — last 7 days

Generated at 2026-05-13T23:18:06.650Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 77 |
| Runs (ingest) | 35 |
| Runs (process) | 42 |
| Articles processed | 152 |
| Articles published | 62 |
| Total cost | $1.1257 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 144 | 127553 | 19727 | $0.2262 |
| extract | 136 | 264009 | 72465 | $0.6263 |
| factcheck | 68 | 145739 | 25494 | $0.2732 |
| total | 348 | 537301 | 117686 | $1.1257 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 23 |
| triage_unhandled | 22 |
| triage_not_an_incident | 9 |
| factcheck_claim_overreach | 8 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_reconcile_disagree | 6 |
| factcheck_date_out_of_window | 5 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 24 |
| bleepingcomputer | 13 |
| darkreading | 13 |
| securityweek | 10 |
| thehackernews | 10 |
| arstechnica_sec | 8 |
| cyberscoop | 6 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
