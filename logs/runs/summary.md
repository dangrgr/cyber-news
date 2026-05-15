# Run summary — last 7 days

Generated at 2026-05-15T09:24:50.622Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 100 |
| Runs (ingest) | 45 |
| Runs (process) | 55 |
| Articles processed | 186 |
| Articles published | 79 |
| Total cost | $1.4643 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 178 | 162453 | 24744 | $0.2862 |
| extract | 174 | 347156 | 93988 | $0.8171 |
| factcheck | 88 | 195391 | 33127 | $0.3610 |
| total | 440 | 705000 | 151859 | $1.4643 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_unhandled | 22 |
| triage_not_an_incident | 16 |
| factcheck_claim_overreach | 11 |
| factcheck_reconcile_disagree | 9 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_date_out_of_window | 7 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 26 |
| bleepingcomputer | 19 |
| darkreading | 13 |
| thehackernews | 13 |
| securityweek | 11 |
| cyberscoop | 10 |
| arstechnica_sec | 8 |
| therecord | 5 |
| riskybiz | 1 |
| schneier | 1 |
