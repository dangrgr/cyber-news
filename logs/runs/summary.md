# Run summary — last 7 days

Generated at 2026-05-16T19:47:17.557Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 58 |
| Runs (process) | 75 |
| Articles processed | 220 |
| Articles published | 101 |
| Total cost | $1.7815 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 211 | 196046 | 29380 | $0.3429 |
| extract | 215 | 420863 | 115320 | $0.9975 |
| factcheck | 112 | 242165 | 39780 | $0.4411 |
| total | 538 | 859074 | 184480 | $1.7815 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 26 |
| triage_unhandled | 22 |
| triage_not_an_incident | 20 |
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
| cyberscoop | 11 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
