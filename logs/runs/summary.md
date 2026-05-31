# Run summary — last 7 days

Generated at 2026-05-31T14:56:12.736Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 118 |
| Runs (ingest) | 63 |
| Runs (process) | 55 |
| Articles processed | 109 |
| Articles published | 55 |
| Total cost | $1.0820 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 109 | 110139 | 15797 | $0.1891 |
| extract | 132 | 261045 | 75381 | $0.6380 |
| factcheck | 61 | 135592 | 23869 | $0.2549 |
| total | 302 | 506776 | 115047 | $1.0820 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 6 |
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
