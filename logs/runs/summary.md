# Run summary — last 7 days

Generated at 2026-05-29T22:57:53.284Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 119 |
| Runs (ingest) | 64 |
| Runs (process) | 55 |
| Articles processed | 111 |
| Articles published | 59 |
| Total cost | $1.0934 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 111 | 112084 | 16003 | $0.1921 |
| extract | 133 | 260845 | 76673 | $0.6442 |
| factcheck | 62 | 136735 | 24079 | $0.2571 |
| total | 306 | 509664 | 116755 | $1.0934 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 3 |
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
| riskybiz | 1 |
| therecord | 1 |
