# Run summary — last 7 days

Generated at 2026-05-12T20:08:52.713Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 58 |
| Runs (ingest) | 25 |
| Runs (process) | 33 |
| Articles processed | 114 |
| Articles published | 42 |
| Total cost | $0.8215 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 106 | 89339 | 14277 | $0.1607 |
| extract | 98 | 196537 | 52928 | $0.4612 |
| factcheck | 48 | 107055 | 18513 | $0.1996 |
| total | 252 | 392931 | 85718 | $0.8215 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| triage_vendor_marketing | 15 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_claim_overreach | 6 |
| factcheck_reconcile_disagree | 6 |
| triage_not_an_incident | 4 |
| factcheck_date_out_of_window | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 21 |
| darkreading | 12 |
| bleepingcomputer | 9 |
| arstechnica_sec | 8 |
| thehackernews | 7 |
| securityweek | 6 |
| cyberscoop | 4 |
| therecord | 3 |
| riskybiz | 1 |
| schneier | 1 |
