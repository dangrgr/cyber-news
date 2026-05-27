# Run summary — last 7 days

Generated at 2026-05-27T05:04:12.513Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 125 |
| Runs (ingest) | 62 |
| Runs (process) | 63 |
| Articles processed | 145 |
| Articles published | 72 |
| Total cost | $1.3041 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 145 | 146268 | 20581 | $0.2492 |
| extract | 166 | 303008 | 91066 | $0.7583 |
| factcheck | 79 | 155029 | 28311 | $0.2966 |
| total | 390 | 604305 | 139958 | $1.3041 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 20 |
| triage_vendor_marketing | 20 |
| factcheck_date_out_of_window | 13 |
| factcheck_claim_overreach | 9 |
| factcheck_reconcile_disagree | 7 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 18 |
| thehackernews | 17 |
| bleepingcomputer | 11 |
| csoonline | 10 |
| therecord | 6 |
| cyberscoop | 4 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
