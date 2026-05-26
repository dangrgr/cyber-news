# Run summary — last 7 days

Generated at 2026-05-26T17:03:18.675Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 62 |
| Runs (process) | 67 |
| Articles processed | 171 |
| Articles published | 81 |
| Total cost | $1.5223 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 171 | 172572 | 24605 | $0.2956 |
| extract | 194 | 355914 | 106115 | $0.8865 |
| factcheck | 91 | 178984 | 32245 | $0.3402 |
| total | 456 | 707470 | 162965 | $1.5223 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 25 |
| triage_vendor_marketing | 21 |
| factcheck_date_out_of_window | 17 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 10 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 22 |
| thehackernews | 18 |
| bleepingcomputer | 16 |
| csoonline | 13 |
| therecord | 8 |
| cyberscoop | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
