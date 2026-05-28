# Run summary — last 7 days

Generated at 2026-05-28T23:01:48.602Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 65 |
| Runs (process) | 59 |
| Articles processed | 121 |
| Articles published | 64 |
| Total cost | $1.1549 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 121 | 121495 | 17279 | $0.2079 |
| extract | 148 | 264445 | 81793 | $0.6734 |
| factcheck | 70 | 142604 | 26205 | $0.2736 |
| total | 339 | 528544 | 125277 | $1.1549 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 18 |
| triage_not_an_incident | 15 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 12 |
| csoonline | 9 |
| bleepingcomputer | 8 |
| therecord | 4 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 2 |
| krebs | 1 |
