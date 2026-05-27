# Run summary — last 7 days

Generated at 2026-05-27T19:05:38.683Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 63 |
| Runs (process) | 61 |
| Articles processed | 139 |
| Articles published | 69 |
| Total cost | $1.2612 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 139 | 139858 | 19762 | $0.2387 |
| extract | 161 | 287893 | 88601 | $0.7309 |
| factcheck | 76 | 149321 | 28465 | $0.2916 |
| total | 376 | 577072 | 136828 | $1.2612 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 23 |
| triage_vendor_marketing | 18 |
| factcheck_date_out_of_window | 12 |
| factcheck_reconcile_disagree | 7 |
| factcheck_claim_overreach | 6 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 16 |
| csoonline | 11 |
| bleepingcomputer | 10 |
| therecord | 6 |
| cyberscoop | 4 |
| darkreading | 3 |
| riskybiz | 3 |
| krebs | 1 |
