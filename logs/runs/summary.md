# Run summary — last 7 days

Generated at 2026-05-23T10:43:36.150Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 55 |
| Runs (process) | 74 |
| Articles processed | 194 |
| Articles published | 95 |
| Total cost | $1.7136 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 192 | 194054 | 27863 | $0.3334 |
| extract | 216 | 397044 | 117402 | $0.9841 |
| factcheck | 108 | 211913 | 36848 | $0.3962 |
| total | 516 | 803011 | 182113 | $1.7136 |

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
