# Run summary — last 7 days

Generated at 2026-06-03T22:53:27.024Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 102 |
| Runs (ingest) | 56 |
| Runs (process) | 46 |
| Articles processed | 75 |
| Articles published | 41 |
| Total cost | $0.7851 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 75 | 76428 | 11079 | $0.1318 |
| extract | 93 | 194602 | 54274 | $0.4660 |
| factcheck | 44 | 104649 | 16534 | $0.1873 |
| total | 212 | 375679 | 81887 | $0.7851 |

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
