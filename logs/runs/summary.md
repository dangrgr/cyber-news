# Run summary — last 7 days

Generated at 2026-05-23T09:12:12.648Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 55 |
| Runs (process) | 74 |
| Articles processed | 192 |
| Articles published | 93 |
| Total cost | $1.6934 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 190 | 191885 | 27554 | $0.3297 |
| extract | 213 | 392658 | 115982 | $0.9726 |
| factcheck | 106 | 208580 | 36517 | $0.3912 |
| total | 509 | 793123 | 180053 | $1.6934 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 19 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
