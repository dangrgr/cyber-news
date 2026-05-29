# Run summary — last 7 days

Generated at 2026-05-29T19:16:45.578Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 120 |
| Runs (ingest) | 64 |
| Runs (process) | 56 |
| Articles processed | 113 |
| Articles published | 60 |
| Total cost | $1.1168 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 113 | 114091 | 16319 | $0.1957 |
| extract | 136 | 266226 | 78421 | $0.6583 |
| factcheck | 64 | 140842 | 24397 | $0.2628 |
| total | 313 | 521159 | 119137 | $1.1168 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 4 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| bleepingcomputer | 10 |
| thehackernews | 10 |
| csoonline | 9 |
| darkreading | 3 |
| cyberscoop | 2 |
| therecord | 2 |
| riskybiz | 1 |
