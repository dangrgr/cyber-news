# Run summary — last 7 days

Generated at 2026-05-13T20:27:02.539Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 75 |
| Runs (ingest) | 34 |
| Runs (process) | 41 |
| Articles processed | 149 |
| Articles published | 59 |
| Total cost | $1.0979 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 141 | 124724 | 19307 | $0.2213 |
| extract | 132 | 257645 | 70636 | $0.6108 |
| factcheck | 65 | 140786 | 25007 | $0.2658 |
| total | 338 | 523155 | 114950 | $1.0979 |

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
