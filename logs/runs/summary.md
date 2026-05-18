# Run summary — last 7 days

Generated at 2026-05-18T21:37:38.470Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 135 |
| Runs (ingest) | 58 |
| Runs (process) | 77 |
| Articles processed | 179 |
| Articles published | 98 |
| Total cost | $1.6297 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 177 | 179720 | 25505 | $0.3072 |
| extract | 198 | 376560 | 106939 | $0.9113 |
| factcheck | 108 | 224054 | 37428 | $0.4112 |
| total | 483 | 780334 | 169872 | $1.6297 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 28 |
| triage_vendor_marketing | 22 |
| factcheck_reconcile_disagree | 10 |
| factcheck_date_out_of_window | 9 |
| factcheck_claim_overreach | 7 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| csoonline | 15 |
| thehackernews | 15 |
| securityweek | 13 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 1 |
| schneier | 1 |
