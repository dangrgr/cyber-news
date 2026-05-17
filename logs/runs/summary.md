# Run summary — last 7 days

Generated at 2026-05-17T18:43:55.900Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 135 |
| Runs (ingest) | 58 |
| Runs (process) | 77 |
| Articles processed | 221 |
| Articles published | 105 |
| Total cost | $1.8083 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 212 | 197718 | 29510 | $0.3453 |
| extract | 218 | 425730 | 117159 | $1.0115 |
| factcheck | 114 | 246399 | 41021 | $0.4515 |
| total | 544 | 869847 | 187690 | $1.8083 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 26 |
| triage_unhandled | 22 |
| triage_not_an_incident | 20 |
| factcheck_claim_overreach | 12 |
| factcheck_date_out_of_window | 9 |
| factcheck_reconcile_disagree | 9 |
| pattern_schema_invalid | 9 |
| factcheck_invalid_cve | 7 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 28 |
| bleepingcomputer | 21 |
| securityweek | 14 |
| darkreading | 13 |
| thehackernews | 13 |
| cyberscoop | 11 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
