# Run summary — last 7 days

Generated at 2026-05-12T05:25:01.658Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 48 |
| Runs (ingest) | 20 |
| Runs (process) | 28 |
| Articles processed | 83 |
| Articles published | 27 |
| Total cost | $0.5964 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 75 | 57794 | 9954 | $0.1076 |
| extract | 69 | 149779 | 38396 | $0.3418 |
| factcheck | 32 | 78687 | 13684 | $0.1471 |
| total | 176 | 286260 | 62034 | $0.5964 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| triage_vendor_marketing | 7 |
| factcheck_claim_overreach | 5 |
| factcheck_reconcile_disagree | 5 |
| factcheck_date_out_of_window | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 17 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| bleepingcomputer | 5 |
| securityweek | 5 |
| thehackernews | 4 |
| cyberscoop | 2 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
