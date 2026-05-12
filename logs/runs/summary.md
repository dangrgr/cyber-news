# Run summary — last 7 days

Generated at 2026-05-12T10:44:15.627Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 52 |
| Runs (ingest) | 22 |
| Runs (process) | 30 |
| Articles processed | 91 |
| Articles published | 29 |
| Total cost | $0.6434 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 83 | 65905 | 11081 | $0.1213 |
| extract | 73 | 157609 | 41334 | $0.3643 |
| factcheck | 34 | 83323 | 14901 | $0.1578 |
| total | 190 | 306837 | 67316 | $0.6434 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| triage_vendor_marketing | 9 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_claim_overreach | 5 |
| factcheck_reconcile_disagree | 5 |
| triage_not_an_incident | 4 |
| factcheck_date_out_of_window | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 20 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| thehackernews | 6 |
| bleepingcomputer | 5 |
| securityweek | 5 |
| cyberscoop | 3 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
