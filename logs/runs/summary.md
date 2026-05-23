# Run summary — last 7 days

Generated at 2026-05-23T11:47:30.113Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 56 |
| Runs (process) | 74 |
| Articles processed | 194 |
| Articles published | 95 |
| Total cost | $1.7264 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 192 | 194042 | 27904 | $0.3336 |
| extract | 217 | 399477 | 118803 | $0.9935 |
| factcheck | 108 | 212671 | 37330 | $0.3993 |
| total | 517 | 806190 | 184037 | $1.7264 |

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
