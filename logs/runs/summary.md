# Run summary — last 7 days

Generated at 2026-05-27T08:50:26.818Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 125 |
| Runs (ingest) | 63 |
| Runs (process) | 62 |
| Articles processed | 141 |
| Articles published | 70 |
| Total cost | $1.2726 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 141 | 142275 | 20050 | $0.2425 |
| extract | 162 | 292228 | 88969 | $0.7371 |
| factcheck | 77 | 151707 | 28261 | $0.2930 |
| total | 380 | 586210 | 137280 | $1.2726 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 20 |
| triage_vendor_marketing | 20 |
| factcheck_date_out_of_window | 12 |
| factcheck_claim_overreach | 8 |
| factcheck_reconcile_disagree | 7 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 18 |
| thehackernews | 16 |
| bleepingcomputer | 11 |
| csoonline | 10 |
| therecord | 6 |
| cyberscoop | 4 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
