# Run summary — last 7 days

Generated at 2026-05-25T18:52:58.389Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 61 |
| Runs (process) | 71 |
| Articles processed | 184 |
| Articles published | 88 |
| Total cost | $1.6273 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 183 | 184358 | 26436 | $0.3165 |
| extract | 206 | 379965 | 113137 | $0.9456 |
| factcheck | 99 | 195445 | 33940 | $0.3651 |
| total | 488 | 759768 | 173513 | $1.6273 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 31 |
| factcheck_date_out_of_window | 19 |
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
| bleepingcomputer | 17 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
