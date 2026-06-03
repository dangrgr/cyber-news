# Run summary — last 7 days

Generated at 2026-06-03T20:45:07.109Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 104 |
| Runs (ingest) | 57 |
| Runs (process) | 47 |
| Articles processed | 77 |
| Articles published | 43 |
| Total cost | $0.8052 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 77 | 78171 | 11392 | $0.1351 |
| extract | 96 | 199547 | 55657 | $0.4778 |
| factcheck | 46 | 107897 | 16872 | $0.1923 |
| total | 219 | 385615 | 83921 | $0.8052 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 10 |
| triage_not_an_incident | 9 |
| factcheck_date_out_of_window | 8 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 8 |
| securityweek | 8 |
| bleepingcomputer | 6 |
| thehackernews | 6 |
| cyberscoop | 2 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
