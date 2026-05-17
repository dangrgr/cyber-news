# Run summary — last 7 days

Generated at 2026-05-17T04:13:45.342Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 139 |
| Runs (ingest) | 62 |
| Runs (process) | 77 |
| Articles processed | 221 |
| Articles published | 102 |
| Total cost | $1.7980 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 212 | 197054 | 29496 | $0.3445 |
| extract | 217 | 425269 | 116273 | $1.0066 |
| factcheck | 113 | 244533 | 40451 | $0.4468 |
| total | 542 | 866856 | 186220 | $1.7980 |

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
