# Run summary — last 7 days

Generated at 2026-06-01T07:23:36.810Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 116 |
| Runs (ingest) | 63 |
| Runs (process) | 53 |
| Articles processed | 109 |
| Articles published | 55 |
| Total cost | $1.0777 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 109 | 110053 | 15765 | $0.1889 |
| extract | 131 | 259774 | 75432 | $0.6369 |
| factcheck | 60 | 133907 | 23606 | $0.2519 |
| total | 300 | 503734 | 114803 | $1.0777 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 12 |
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
| csoonline | 10 |
| darkreading | 3 |
| cyberscoop | 2 |
| therecord | 1 |
