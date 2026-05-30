# Run summary — last 7 days

Generated at 2026-05-30T16:43:14.805Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 119 |
| Runs (ingest) | 64 |
| Runs (process) | 55 |
| Articles processed | 109 |
| Articles published | 55 |
| Total cost | $1.0751 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 109 | 110167 | 15787 | $0.1891 |
| extract | 130 | 258571 | 74865 | $0.6329 |
| factcheck | 60 | 134369 | 23755 | $0.2531 |
| total | 299 | 503107 | 114407 | $1.0751 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 5 |
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
