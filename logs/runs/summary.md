# Run summary — last 7 days

Generated at 2026-06-01T19:15:40.416Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 110 |
| Runs (ingest) | 61 |
| Runs (process) | 49 |
| Articles processed | 93 |
| Articles published | 48 |
| Total cost | $0.9160 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 93 | 93715 | 13456 | $0.1610 |
| extract | 111 | 220289 | 63371 | $0.5371 |
| factcheck | 52 | 117386 | 20093 | $0.2179 |
| total | 256 | 431390 | 96920 | $0.9160 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 16 |
| triage_not_an_incident | 11 |
| factcheck_date_out_of_window | 10 |
| factcheck_reconcile_disagree | 4 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 14 |
| bleepingcomputer | 9 |
| csoonline | 8 |
| thehackernews | 8 |
| darkreading | 3 |
| cyberscoop | 2 |
| therecord | 1 |
