# Run summary — last 7 days

Generated at 2026-05-23T18:40:36.193Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 128 |
| Runs (ingest) | 56 |
| Runs (process) | 72 |
| Articles processed | 196 |
| Articles published | 96 |
| Total cost | $1.7468 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 194 | 195863 | 28171 | $0.3367 |
| extract | 221 | 404311 | 120272 | $1.0057 |
| factcheck | 109 | 213407 | 38192 | $0.4044 |
| total | 524 | 813581 | 186635 | $1.7468 |

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
