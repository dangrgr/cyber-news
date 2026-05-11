# Run summary — last 7 days

Generated at 2026-05-11T05:43:39.839Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 31 |
| Runs (ingest) | 12 |
| Runs (process) | 19 |
| Articles processed | 48 |
| Articles published | 12 |
| Total cost | $0.2399 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 40 | 29796 | 5182 | $0.0557 |
| extract | 29 | 61953 | 14071 | $0.1323 |
| factcheck | 14 | 30252 | 4332 | $0.0519 |
| total | 83 | 122001 | 23585 | $0.2399 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 16 |
| pattern_schema_invalid | 8 |
| factcheck_invalid_cve | 6 |
| triage_vendor_marketing | 3 |
| factcheck_reconcile_disagree | 2 |
| factcheck_date_out_of_window | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 12 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| bleepingcomputer | 2 |
| riskybiz | 1 |
| thehackernews | 1 |
