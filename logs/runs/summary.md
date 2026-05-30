# Run summary — last 7 days

Generated at 2026-05-30T07:50:03.187Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 119 |
| Runs (ingest) | 64 |
| Runs (process) | 55 |
| Articles processed | 110 |
| Articles published | 58 |
| Total cost | $1.0800 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 110 | 111060 | 15864 | $0.1904 |
| extract | 131 | 257451 | 75751 | $0.6362 |
| factcheck | 61 | 134863 | 23705 | $0.2534 |
| total | 302 | 503374 | 115320 | $1.0800 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| bleepingcomputer | 10 |
| thehackernews | 10 |
| csoonline | 9 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 1 |
| therecord | 1 |
