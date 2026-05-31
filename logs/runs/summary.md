# Run summary — last 7 days

Generated at 2026-05-31T23:14:41.192Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 116 |
| Runs (ingest) | 63 |
| Runs (process) | 53 |
| Articles processed | 108 |
| Articles published | 54 |
| Total cost | $1.0736 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 108 | 109084 | 15640 | $0.1873 |
| extract | 131 | 259354 | 74823 | $0.6335 |
| factcheck | 60 | 133643 | 23844 | $0.2529 |
| total | 299 | 502081 | 114307 | $1.0736 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 17 |
| thehackernews | 11 |
| bleepingcomputer | 10 |
| csoonline | 9 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 1 |
| therecord | 1 |
