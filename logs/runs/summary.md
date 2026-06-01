# Run summary — last 7 days

Generated at 2026-06-01T13:19:56.775Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 115 |
| Runs (ingest) | 63 |
| Runs (process) | 52 |
| Articles processed | 106 |
| Articles published | 53 |
| Total cost | $1.0404 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 106 | 106997 | 15377 | $0.1839 |
| extract | 126 | 250761 | 72627 | $0.6139 |
| factcheck | 58 | 129474 | 22631 | $0.2426 |
| total | 290 | 487232 | 110635 | $1.0404 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 12 |
| triage_not_an_incident | 12 |
| factcheck_reconcile_disagree | 5 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 11 |
| bleepingcomputer | 10 |
| csoonline | 10 |
| darkreading | 3 |
| cyberscoop | 2 |
| therecord | 1 |
