# Run summary — last 7 days

Generated at 2026-05-17T22:07:56.574Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 57 |
| Runs (process) | 77 |
| Articles processed | 178 |
| Articles published | 94 |
| Total cost | $1.6126 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 177 | 171944 | 25004 | $0.2970 |
| extract | 195 | 375461 | 106014 | $0.9055 |
| factcheck | 103 | 221991 | 37615 | $0.4101 |
| total | 475 | 769396 | 168633 | $1.6126 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 23 |
| triage_not_an_incident | 20 |
| factcheck_claim_overreach | 12 |
| factcheck_reconcile_disagree | 9 |
| factcheck_date_out_of_window | 8 |
| triage_unhandled | 7 |
| factcheck_invalid_cve | 2 |
| factcheck_entity_not_in_article | 1 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| csoonline | 16 |
| securityweek | 14 |
| thehackernews | 13 |
| cyberscoop | 11 |
| therecord | 5 |
| schneier | 2 |
| darkreading | 1 |
| riskybiz | 1 |
