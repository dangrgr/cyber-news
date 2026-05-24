# Run summary — last 7 days

Generated at 2026-05-24T15:22:28.090Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 59 |
| Runs (process) | 72 |
| Articles processed | 196 |
| Articles published | 96 |
| Total cost | $1.7425 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 194 | 195907 | 28273 | $0.3373 |
| extract | 220 | 402412 | 120314 | $1.0040 |
| factcheck | 109 | 213630 | 37528 | $0.4013 |
| total | 523 | 811949 | 186115 | $1.7425 |

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
