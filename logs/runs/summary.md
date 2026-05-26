# Run summary — last 7 days

Generated at 2026-05-26T05:51:27.386Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 62 |
| Runs (process) | 69 |
| Articles processed | 171 |
| Articles published | 80 |
| Total cost | $1.5298 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 170 | 171809 | 24517 | $0.2944 |
| extract | 194 | 358688 | 106765 | $0.8925 |
| factcheck | 91 | 180669 | 32452 | $0.3429 |
| total | 455 | 711166 | 163734 | $1.5298 |

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
