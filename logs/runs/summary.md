# Run summary — last 7 days

Generated at 2026-06-03T12:26:33.199Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 105 |
| Runs (ingest) | 57 |
| Runs (process) | 48 |
| Articles processed | 80 |
| Articles published | 43 |
| Total cost | $0.8216 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 80 | 80765 | 11692 | $0.1392 |
| extract | 99 | 202635 | 57206 | $0.4887 |
| factcheck | 46 | 106971 | 17346 | $0.1937 |
| total | 225 | 390371 | 86244 | $0.8216 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 11 |
| factcheck_date_out_of_window | 10 |
| triage_vendor_marketing | 9 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 11 |
| csoonline | 7 |
| thehackernews | 7 |
| bleepingcomputer | 6 |
| cyberscoop | 2 |
| darkreading | 2 |
| riskybiz | 1 |
| therecord | 1 |
