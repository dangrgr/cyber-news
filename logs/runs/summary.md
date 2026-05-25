# Run summary — last 7 days

Generated at 2026-05-25T13:40:17.742Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 60 |
| Runs (process) | 70 |
| Articles processed | 192 |
| Articles published | 93 |
| Total cost | $1.6983 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 190 | 191468 | 27432 | $0.3286 |
| extract | 215 | 394149 | 117756 | $0.9829 |
| factcheck | 106 | 208330 | 35687 | $0.3868 |
| total | 511 | 793947 | 180875 | $1.6983 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 34 |
| factcheck_date_out_of_window | 18 |
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
| thehackernews | 20 |
| bleepingcomputer | 17 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
