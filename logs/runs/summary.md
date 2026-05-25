# Run summary — last 7 days

Generated at 2026-05-25T23:19:17.255Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 61 |
| Runs (process) | 70 |
| Articles processed | 172 |
| Articles published | 81 |
| Total cost | $1.5378 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 171 | 172861 | 24713 | $0.2964 |
| extract | 195 | 360210 | 107273 | $0.8966 |
| factcheck | 92 | 182391 | 32477 | $0.3448 |
| total | 458 | 715462 | 164463 | $1.5378 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 27 |
| factcheck_date_out_of_window | 18 |
| triage_vendor_marketing | 17 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 11 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 20 |
| thehackernews | 18 |
| bleepingcomputer | 16 |
| csoonline | 16 |
| therecord | 8 |
| cyberscoop | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
