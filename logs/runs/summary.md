# Run summary — last 7 days

Generated at 2026-06-04T02:12:41.532Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 103 |
| Runs (ingest) | 56 |
| Runs (process) | 47 |
| Articles processed | 80 |
| Articles published | 46 |
| Total cost | $0.8425 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 80 | 81678 | 11852 | $0.1409 |
| extract | 100 | 208743 | 58072 | $0.4991 |
| factcheck | 49 | 115692 | 17362 | $0.2025 |
| total | 229 | 406113 | 87286 | $0.8425 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 10 |
| triage_not_an_incident | 9 |
| factcheck_date_out_of_window | 8 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 8 |
| securityweek | 8 |
| bleepingcomputer | 6 |
| thehackernews | 6 |
| cyberscoop | 2 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
