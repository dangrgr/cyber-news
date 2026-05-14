# Run summary — last 7 days

Generated at 2026-05-14T13:05:46.956Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 83 |
| Runs (ingest) | 37 |
| Runs (process) | 46 |
| Articles processed | 164 |
| Articles published | 68 |
| Total cost | $1.2198 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 156 | 139912 | 21480 | $0.2473 |
| extract | 148 | 286024 | 78410 | $0.6781 |
| factcheck | 75 | 158974 | 27094 | $0.2944 |
| total | 379 | 584910 | 126984 | $1.2198 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 23 |
| triage_unhandled | 22 |
| triage_not_an_incident | 12 |
| factcheck_claim_overreach | 8 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_date_out_of_window | 7 |
| factcheck_reconcile_disagree | 7 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 26 |
| bleepingcomputer | 15 |
| darkreading | 13 |
| securityweek | 10 |
| thehackernews | 10 |
| arstechnica_sec | 8 |
| cyberscoop | 8 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
