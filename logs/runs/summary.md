# Run summary — last 7 days

Generated at 2026-05-20T12:39:11.936Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 55 |
| Runs (process) | 79 |
| Articles processed | 192 |
| Articles published | 96 |
| Total cost | $1.7343 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 189 | 192035 | 27542 | $0.3297 |
| extract | 210 | 409659 | 114968 | $0.9845 |
| factcheck | 110 | 230598 | 37885 | $0.4200 |
| total | 509 | 832292 | 180395 | $1.7343 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 31 |
| triage_vendor_marketing | 18 |
| factcheck_date_out_of_window | 14 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 25 |
| securityweek | 19 |
| csoonline | 16 |
| thehackernews | 16 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
