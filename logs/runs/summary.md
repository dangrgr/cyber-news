# Run summary — last 7 days

Generated at 2026-05-28T17:04:18.925Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 125 |
| Runs (ingest) | 66 |
| Runs (process) | 59 |
| Articles processed | 110 |
| Articles published | 57 |
| Total cost | $1.0347 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 110 | 110267 | 15635 | $0.1884 |
| extract | 133 | 236108 | 72821 | $0.6002 |
| factcheck | 63 | 126294 | 23949 | $0.2460 |
| total | 306 | 472669 | 112405 | $1.0347 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 18 |
| triage_vendor_marketing | 15 |
| factcheck_date_out_of_window | 9 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 14 |
| thehackernews | 11 |
| csoonline | 9 |
| bleepingcomputer | 7 |
| therecord | 4 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 2 |
| krebs | 1 |
