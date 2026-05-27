# Run summary — last 7 days

Generated at 2026-05-27T21:13:45.272Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 63 |
| Runs (process) | 60 |
| Articles processed | 128 |
| Articles published | 66 |
| Total cost | $1.1864 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 128 | 128736 | 18297 | $0.2202 |
| extract | 151 | 272489 | 83193 | $0.6885 |
| factcheck | 73 | 144343 | 26681 | $0.2777 |
| total | 352 | 545568 | 128171 | $1.1864 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 21 |
| triage_vendor_marketing | 16 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 7 |
| factcheck_claim_overreach | 3 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 14 |
| thehackernews | 14 |
| csoonline | 10 |
| bleepingcomputer | 8 |
| therecord | 5 |
| cyberscoop | 4 |
| darkreading | 3 |
| riskybiz | 3 |
| krebs | 1 |
