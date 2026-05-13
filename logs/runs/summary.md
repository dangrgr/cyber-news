# Run summary — last 7 days

Generated at 2026-05-13T23:21:22.164Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 78 |
| Runs (ingest) | 35 |
| Runs (process) | 43 |
| Articles processed | 156 |
| Articles published | 63 |
| Total cost | $1.1527 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 148 | 131607 | 20262 | $0.2329 |
| extract | 139 | 268968 | 74146 | $0.6397 |
| factcheck | 70 | 149475 | 26128 | $0.2801 |
| total | 357 | 550050 | 120536 | $1.1527 |

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
| factcheck_date_out_of_window | 5 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 24 |
| bleepingcomputer | 14 |
| darkreading | 13 |
| securityweek | 10 |
| thehackernews | 10 |
| arstechnica_sec | 8 |
| cyberscoop | 8 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
