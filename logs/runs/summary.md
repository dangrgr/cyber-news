# Run summary — last 7 days

Generated at 2026-05-30T12:15:14.017Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 118 |
| Runs (ingest) | 63 |
| Runs (process) | 55 |
| Articles processed | 108 |
| Articles published | 55 |
| Total cost | $1.0521 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 108 | 108888 | 15553 | $0.1867 |
| extract | 128 | 252045 | 73376 | $0.6189 |
| factcheck | 59 | 130723 | 23158 | $0.2465 |
| total | 295 | 491656 | 112087 | $1.0521 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 4 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 11 |
| bleepingcomputer | 10 |
| csoonline | 9 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 1 |
| therecord | 1 |
