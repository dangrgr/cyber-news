# Run summary — last 7 days

Generated at 2026-06-04T13:50:40.629Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 102 |
| Runs (ingest) | 55 |
| Runs (process) | 47 |
| Articles processed | 88 |
| Articles published | 51 |
| Total cost | $0.9127 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 88 | 89869 | 13007 | $0.1549 |
| extract | 110 | 224303 | 63148 | $0.5400 |
| factcheck | 54 | 124392 | 18671 | $0.2177 |
| total | 252 | 438564 | 94826 | $0.9127 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 11 |
| triage_vendor_marketing | 10 |
| factcheck_date_out_of_window | 9 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 9 |
| securityweek | 8 |
| thehackernews | 7 |
| bleepingcomputer | 6 |
| cyberscoop | 2 |
| riskybiz | 2 |
| darkreading | 1 |
| schneier | 1 |
| therecord | 1 |
