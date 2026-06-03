# Run summary — last 7 days

Generated at 2026-06-03T17:33:42.161Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 105 |
| Runs (ingest) | 57 |
| Runs (process) | 48 |
| Articles processed | 80 |
| Articles published | 45 |
| Total cost | $0.8393 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 80 | 80925 | 11815 | $0.1400 |
| extract | 100 | 207797 | 58050 | $0.4980 |
| factcheck | 48 | 112635 | 17728 | $0.2013 |
| total | 228 | 401357 | 87593 | $0.8393 |

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
| csoonline | 8 |
| securityweek | 8 |
| bleepingcomputer | 6 |
| thehackernews | 6 |
| cyberscoop | 2 |
| darkreading | 2 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
