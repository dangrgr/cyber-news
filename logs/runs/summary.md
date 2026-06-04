# Run summary — last 7 days

Generated at 2026-06-04T10:44:43.613Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 102 |
| Runs (ingest) | 55 |
| Runs (process) | 47 |
| Articles processed | 82 |
| Articles published | 47 |
| Total cost | $0.8578 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 82 | 83705 | 12170 | $0.1446 |
| extract | 102 | 211715 | 59096 | $0.5072 |
| factcheck | 50 | 117443 | 17724 | $0.2061 |
| total | 234 | 412863 | 88990 | $0.8578 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 10 |
| triage_vendor_marketing | 10 |
| factcheck_date_out_of_window | 8 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 9 |
| securityweek | 8 |
| bleepingcomputer | 6 |
| thehackernews | 6 |
| cyberscoop | 2 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
