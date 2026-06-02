# Run summary — last 7 days

Generated at 2026-06-02T17:49:51.157Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 106 |
| Runs (ingest) | 58 |
| Runs (process) | 48 |
| Articles processed | 81 |
| Articles published | 42 |
| Total cost | $0.8283 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 81 | 81416 | 11796 | $0.1404 |
| extract | 100 | 203190 | 57626 | $0.4913 |
| factcheck | 46 | 106827 | 17958 | $0.1966 |
| total | 227 | 391433 | 87380 | $0.8283 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 11 |
| factcheck_date_out_of_window | 10 |
| triage_vendor_marketing | 10 |
| factcheck_reconcile_disagree | 4 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 11 |
| bleepingcomputer | 8 |
| csoonline | 8 |
| thehackernews | 6 |
| darkreading | 3 |
| cyberscoop | 2 |
| therecord | 1 |
