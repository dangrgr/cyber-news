# Run summary — last 7 days

Generated at 2026-05-22T14:00:30.837Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 53 |
| Runs (process) | 76 |
| Articles processed | 192 |
| Articles published | 94 |
| Total cost | $1.7063 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 190 | 192221 | 27441 | $0.3294 |
| extract | 213 | 397225 | 115831 | $0.9764 |
| factcheck | 108 | 214015 | 37302 | $0.4005 |
| total | 511 | 803461 | 180574 | $1.7063 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 34 |
| factcheck_date_out_of_window | 16 |
| triage_vendor_marketing | 16 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 13 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 22 |
| securityweek | 21 |
| thehackernews | 18 |
| csoonline | 16 |
| cyberscoop | 8 |
| therecord | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
