# Run summary — last 7 days

Generated at 2026-05-24T00:08:10.146Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 127 |
| Runs (ingest) | 55 |
| Runs (process) | 72 |
| Articles processed | 196 |
| Articles published | 96 |
| Total cost | $1.7472 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 194 | 195862 | 28213 | $0.3369 |
| extract | 221 | 403871 | 120669 | $1.0072 |
| factcheck | 109 | 213405 | 37924 | $0.4030 |
| total | 524 | 813138 | 186806 | $1.7472 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 16 |
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
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
