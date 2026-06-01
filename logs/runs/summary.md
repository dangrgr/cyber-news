# Run summary — last 7 days

Generated at 2026-06-01T07:17:23.760Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 115 |
| Runs (ingest) | 63 |
| Runs (process) | 52 |
| Articles processed | 107 |
| Articles published | 54 |
| Total cost | $1.0350 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 107 | 108069 | 15498 | $0.1856 |
| extract | 129 | 247098 | 72054 | $0.6074 |
| factcheck | 59 | 126758 | 23061 | $0.2421 |
| total | 295 | 481925 | 110613 | $1.0350 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
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
| therecord | 1 |
