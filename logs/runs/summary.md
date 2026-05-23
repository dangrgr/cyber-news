# Run summary — last 7 days

Generated at 2026-05-23T14:02:36.208Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 128 |
| Runs (ingest) | 55 |
| Runs (process) | 73 |
| Articles processed | 195 |
| Articles published | 96 |
| Total cost | $1.7400 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 193 | 195069 | 28051 | $0.3353 |
| extract | 219 | 402679 | 119822 | $1.0018 |
| factcheck | 109 | 214504 | 37667 | $0.4028 |
| total | 521 | 812252 | 185540 | $1.7400 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 19 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
