# Run summary — last 7 days

Generated at 2026-05-11T18:04:42.823Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 39 |
| Runs (ingest) | 16 |
| Runs (process) | 23 |
| Articles processed | 77 |
| Articles published | 23 |
| Total cost | $0.5260 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 69 | 52369 | 9116 | $0.0979 |
| extract | 60 | 132050 | 33643 | $0.3003 |
| factcheck | 28 | 69709 | 11618 | $0.1278 |
| total | 157 | 254128 | 54377 | $0.5260 |

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
