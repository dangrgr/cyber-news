# Run summary — last 7 days

Generated at 2026-05-27T05:03:16.212Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 62 |
| Runs (process) | 62 |
| Articles processed | 144 |
| Articles published | 72 |
| Total cost | $1.3023 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 144 | 145274 | 20427 | $0.2474 |
| extract | 166 | 303008 | 91066 | $0.7583 |
| factcheck | 79 | 155029 | 28311 | $0.2966 |
| total | 389 | 603311 | 139804 | $1.3023 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 20 |
| triage_vendor_marketing | 19 |
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
| csoonline | 9 |
| therecord | 6 |
| cyberscoop | 4 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
