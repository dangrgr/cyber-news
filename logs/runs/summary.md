# Run summary — last 7 days

Generated at 2026-05-14T21:50:54.693Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 91 |
| Runs (ingest) | 41 |
| Runs (process) | 50 |
| Articles processed | 178 |
| Articles published | 74 |
| Total cost | $1.3795 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 170 | 154548 | 23594 | $0.2725 |
| extract | 164 | 322050 | 88963 | $0.7669 |
| factcheck | 83 | 182542 | 31515 | $0.3401 |
| total | 417 | 659140 | 144072 | $1.3795 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_unhandled | 22 |
| triage_not_an_incident | 15 |
| factcheck_claim_overreach | 9 |
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
| bleepingcomputer | 18 |
| darkreading | 13 |
| thehackernews | 13 |
| securityweek | 11 |
| cyberscoop | 9 |
| arstechnica_sec | 8 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
