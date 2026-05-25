# Run summary — last 7 days

Generated at 2026-05-25T16:32:04.752Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 60 |
| Runs (process) | 70 |
| Articles processed | 187 |
| Articles published | 89 |
| Total cost | $1.6420 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 186 | 187309 | 26829 | $0.3215 |
| extract | 208 | 382088 | 114269 | $0.9534 |
| factcheck | 100 | 197317 | 33965 | $0.3671 |
| total | 494 | 766714 | 175063 | $1.6420 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 33 |
| factcheck_date_out_of_window | 20 |
| triage_vendor_marketing | 16 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 11 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 19 |
| csoonline | 18 |
| bleepingcomputer | 16 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
