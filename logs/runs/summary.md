# Run summary — last 7 days

Generated at 2026-05-12T17:40:47.214Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 56 |
| Runs (ingest) | 25 |
| Runs (process) | 31 |
| Articles processed | 99 |
| Articles published | 33 |
| Total cost | $0.7162 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 91 | 74003 | 12167 | $0.1348 |
| extract | 84 | 175494 | 46551 | $0.4082 |
| factcheck | 38 | 90339 | 16564 | $0.1732 |
| total | 213 | 339836 | 75282 | $0.7162 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| triage_vendor_marketing | 10 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_claim_overreach | 6 |
| factcheck_reconcile_disagree | 5 |
| triage_not_an_incident | 4 |
| factcheck_date_out_of_window | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 21 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| thehackernews | 7 |
| securityweek | 6 |
| bleepingcomputer | 5 |
| cyberscoop | 3 |
| therecord | 2 |
| riskybiz | 1 |
| schneier | 1 |
