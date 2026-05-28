# Run summary — last 7 days

Generated at 2026-05-28T19:23:28.055Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 65 |
| Runs (process) | 59 |
| Articles processed | 121 |
| Articles published | 62 |
| Total cost | $1.1294 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 121 | 121423 | 17235 | $0.2076 |
| extract | 144 | 257661 | 79658 | $0.6560 |
| factcheck | 68 | 138596 | 25452 | $0.2659 |
| total | 333 | 517680 | 122345 | $1.1294 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 18 |
| triage_vendor_marketing | 17 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 15 |
| thehackernews | 12 |
| bleepingcomputer | 9 |
| csoonline | 9 |
| therecord | 5 |
| cyberscoop | 3 |
| darkreading | 3 |
| riskybiz | 2 |
| krebs | 1 |
