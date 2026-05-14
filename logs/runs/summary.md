# Run summary — last 7 days

Generated at 2026-05-14T08:18:06.256Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 81 |
| Runs (ingest) | 36 |
| Runs (process) | 45 |
| Articles processed | 157 |
| Articles published | 63 |
| Total cost | $1.1598 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 149 | 132633 | 20386 | $0.2346 |
| extract | 140 | 271636 | 74689 | $0.6451 |
| factcheck | 70 | 149475 | 26128 | $0.2801 |
| total | 359 | 553744 | 121203 | $1.1598 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 23 |
| triage_unhandled | 22 |
| triage_not_an_incident | 11 |
| factcheck_claim_overreach | 8 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_reconcile_disagree | 7 |
| factcheck_date_out_of_window | 6 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 25 |
| bleepingcomputer | 14 |
| darkreading | 13 |
| securityweek | 10 |
| thehackernews | 10 |
| arstechnica_sec | 8 |
| cyberscoop | 8 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
