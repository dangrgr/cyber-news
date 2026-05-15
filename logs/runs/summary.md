# Run summary — last 7 days

Generated at 2026-05-15T01:28:00.010Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 95 |
| Runs (ingest) | 43 |
| Runs (process) | 52 |
| Articles processed | 184 |
| Articles published | 77 |
| Total cost | $1.4208 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 176 | 160360 | 24396 | $0.2823 |
| extract | 170 | 331976 | 91734 | $0.7906 |
| factcheck | 86 | 187301 | 32107 | $0.3478 |
| total | 432 | 679637 | 148237 | $1.4208 |

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
