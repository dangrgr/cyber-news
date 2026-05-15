# Run summary — last 7 days

Generated at 2026-05-15T18:58:09.220Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 109 |
| Runs (ingest) | 49 |
| Runs (process) | 60 |
| Articles processed | 213 |
| Articles published | 95 |
| Total cost | $1.7147 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 204 | 188876 | 28387 | $0.3308 |
| extract | 206 | 405638 | 111091 | $0.9611 |
| factcheck | 106 | 230964 | 38373 | $0.4228 |
| total | 516 | 825478 | 177851 | $1.7147 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 26 |
| triage_unhandled | 22 |
| triage_not_an_incident | 19 |
| factcheck_claim_overreach | 12 |
| factcheck_reconcile_disagree | 11 |
| factcheck_date_out_of_window | 9 |
| pattern_schema_invalid | 9 |
| factcheck_invalid_cve | 8 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 28 |
| bleepingcomputer | 23 |
| securityweek | 14 |
| thehackernews | 14 |
| darkreading | 13 |
| cyberscoop | 10 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
