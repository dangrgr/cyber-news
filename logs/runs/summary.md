# Run summary — last 7 days

Generated at 2026-05-11T17:39:37.929Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 38 |
| Runs (ingest) | 16 |
| Runs (process) | 22 |
| Articles processed | 75 |
| Articles published | 21 |
| Total cost | $0.5001 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 67 | 51100 | 8840 | $0.0953 |
| extract | 57 | 125287 | 31787 | $0.2842 |
| factcheck | 26 | 65419 | 11028 | $0.1206 |
| total | 150 | 241806 | 51655 | $0.5001 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| triage_vendor_marketing | 6 |
| factcheck_reconcile_disagree | 5 |
| factcheck_claim_overreach | 4 |
| factcheck_date_out_of_window | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 16 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| bleepingcomputer | 5 |
| securityweek | 5 |
| thehackernews | 3 |
| cyberscoop | 2 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
