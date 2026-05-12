# Run summary — last 7 days

Generated at 2026-05-12T17:49:34.015Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 57 |
| Runs (ingest) | 25 |
| Runs (process) | 32 |
| Articles processed | 105 |
| Articles published | 37 |
| Total cost | $0.7604 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 97 | 80073 | 13032 | $0.1452 |
| extract | 90 | 184457 | 49252 | $0.4307 |
| factcheck | 42 | 96941 | 17499 | $0.1844 |
| total | 229 | 361471 | 79783 | $0.7604 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| triage_vendor_marketing | 12 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_claim_overreach | 6 |
| factcheck_reconcile_disagree | 5 |
| triage_not_an_incident | 4 |
| factcheck_date_out_of_window | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 21 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| thehackernews | 7 |
| bleepingcomputer | 6 |
| securityweek | 6 |
| cyberscoop | 4 |
| therecord | 2 |
| riskybiz | 1 |
| schneier | 1 |
