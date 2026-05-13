# Run summary — last 7 days

Generated at 2026-05-13T16:32:01.192Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 71 |
| Runs (ingest) | 32 |
| Runs (process) | 39 |
| Articles processed | 138 |
| Articles published | 54 |
| Total cost | $1.0220 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 130 | 113549 | 17705 | $0.2021 |
| extract | 123 | 241972 | 66386 | $0.5739 |
| factcheck | 60 | 131509 | 22909 | $0.2461 |
| total | 313 | 487030 | 107000 | $1.0220 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| triage_vendor_marketing | 17 |
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
| darkreading | 13 |
| bleepingcomputer | 12 |
| thehackernews | 9 |
| arstechnica_sec | 8 |
| securityweek | 8 |
| cyberscoop | 4 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
