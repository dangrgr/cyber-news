# Run summary — last 7 days

Generated at 2026-05-28T21:35:04.110Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 65 |
| Runs (process) | 59 |
| Articles processed | 125 |
| Articles published | 64 |
| Total cost | $1.1656 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 125 | 125478 | 17796 | $0.2145 |
| extract | 149 | 266287 | 82250 | $0.6775 |
| factcheck | 70 | 142604 | 26205 | $0.2736 |
| total | 344 | 534369 | 126251 | $1.1656 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 18 |
| triage_vendor_marketing | 18 |
| factcheck_date_out_of_window | 12 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 12 |
| bleepingcomputer | 9 |
| csoonline | 9 |
| therecord | 5 |
| cyberscoop | 4 |
| darkreading | 3 |
| riskybiz | 2 |
| krebs | 1 |
