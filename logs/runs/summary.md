# Run summary — last 7 days

Generated at 2026-05-29T00:20:13.179Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 65 |
| Runs (process) | 59 |
| Articles processed | 121 |
| Articles published | 63 |
| Total cost | $1.1486 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 121 | 121525 | 17325 | $0.2081 |
| extract | 147 | 262755 | 81658 | $0.6710 |
| factcheck | 69 | 140534 | 25771 | $0.2694 |
| total | 337 | 524814 | 124754 | $1.1486 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 18 |
| triage_not_an_incident | 15 |
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
| therecord | 4 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 2 |
| krebs | 1 |
