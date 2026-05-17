# Run summary — last 7 days

Generated at 2026-05-17T13:56:25.929Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 135 |
| Runs (ingest) | 58 |
| Runs (process) | 77 |
| Articles processed | 221 |
| Articles published | 103 |
| Total cost | $1.8040 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 212 | 197219 | 29461 | $0.3445 |
| extract | 218 | 425856 | 116597 | $1.0088 |
| factcheck | 114 | 246257 | 40872 | $0.4506 |
| total | 544 | 869332 | 186930 | $1.8040 |

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
| factcheck_invalid_cve | 7 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 28 |
| bleepingcomputer | 23 |
| securityweek | 14 |
| darkreading | 13 |
| thehackernews | 13 |
| cyberscoop | 11 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
