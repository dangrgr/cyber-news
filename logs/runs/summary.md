# Run summary — last 7 days

Generated at 2026-05-26T13:41:47.437Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 62 |
| Runs (process) | 68 |
| Articles processed | 178 |
| Articles published | 83 |
| Total cost | $1.5733 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 177 | 178653 | 25504 | $0.3062 |
| extract | 200 | 366665 | 109609 | $0.9147 |
| factcheck | 94 | 185232 | 33441 | $0.3524 |
| total | 471 | 730550 | 168554 | $1.5733 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 27 |
| triage_vendor_marketing | 21 |
| factcheck_date_out_of_window | 18 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 11 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 23 |
| thehackernews | 20 |
| bleepingcomputer | 17 |
| csoonline | 14 |
| therecord | 8 |
| cyberscoop | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
