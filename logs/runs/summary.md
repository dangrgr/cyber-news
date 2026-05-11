# Run summary — last 7 days

Generated at 2026-05-11T23:40:07.064Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 44 |
| Runs (ingest) | 18 |
| Runs (process) | 26 |
| Articles processed | 79 |
| Articles published | 24 |
| Total cost | $0.5468 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 71 | 54004 | 9388 | $0.1009 |
| extract | 63 | 136729 | 35326 | $0.3134 |
| factcheck | 29 | 71601 | 12177 | $0.1325 |
| total | 163 | 262334 | 56891 | $0.5468 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| triage_vendor_marketing | 6 |
| factcheck_claim_overreach | 5 |
| factcheck_reconcile_disagree | 5 |
| factcheck_date_out_of_window | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 16 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| bleepingcomputer | 5 |
| securityweek | 5 |
| thehackernews | 4 |
| cyberscoop | 2 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
