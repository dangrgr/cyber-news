# Run summary — last 7 days

Generated at 2026-05-28T00:16:38.800Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 64 |
| Runs (process) | 59 |
| Articles processed | 125 |
| Articles published | 64 |
| Total cost | $1.1552 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 125 | 125665 | 17860 | $0.2150 |
| extract | 147 | 265527 | 81095 | $0.6710 |
| factcheck | 71 | 140465 | 25749 | $0.2692 |
| total | 343 | 531657 | 124704 | $1.1552 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 21 |
| triage_vendor_marketing | 15 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 7 |
| factcheck_claim_overreach | 3 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 14 |
| thehackernews | 14 |
| csoonline | 10 |
| bleepingcomputer | 8 |
| therecord | 5 |
| cyberscoop | 3 |
| darkreading | 3 |
| riskybiz | 3 |
| krebs | 1 |
