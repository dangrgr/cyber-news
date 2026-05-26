# Run summary — last 7 days

Generated at 2026-05-26T13:33:50.934Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 62 |
| Runs (process) | 67 |
| Articles processed | 166 |
| Articles published | 77 |
| Total cost | $1.4857 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 165 | 166354 | 23844 | $0.2856 |
| extract | 189 | 349566 | 103864 | $0.8689 |
| factcheck | 88 | 174673 | 31306 | $0.3312 |
| total | 442 | 690593 | 159014 | $1.4857 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 27 |
| factcheck_date_out_of_window | 18 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 11 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 20 |
| thehackernews | 18 |
| bleepingcomputer | 16 |
| csoonline | 14 |
| therecord | 8 |
| cyberscoop | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
