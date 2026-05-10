# Run summary — last 7 days

Generated at 2026-05-10T19:37:57.240Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 22 |
| Runs (ingest) | 9 |
| Runs (process) | 13 |
| Articles processed | 46 |
| Articles published | 11 |
| Total cost | $0.2313 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 38 | 28233 | 4917 | $0.0528 |
| extract | 28 | 60360 | 13609 | $0.1284 |
| factcheck | 13 | 28494 | 4307 | $0.0500 |
| total | 79 | 117087 | 22833 | $0.2313 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 15 |
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
| thehackernews | 1 |
