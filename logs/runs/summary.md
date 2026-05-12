# Run summary — last 7 days

Generated at 2026-05-12T23:44:32.451Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 63 |
| Runs (ingest) | 27 |
| Runs (process) | 36 |
| Articles processed | 119 |
| Articles published | 45 |
| Total cost | $0.8705 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 111 | 94091 | 14979 | $0.1690 |
| extract | 104 | 207862 | 56416 | $0.4899 |
| factcheck | 51 | 113410 | 19629 | $0.2116 |
| total | 266 | 415363 | 91024 | $0.8705 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| triage_vendor_marketing | 15 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_claim_overreach | 6 |
| factcheck_reconcile_disagree | 6 |
| triage_not_an_incident | 5 |
| factcheck_date_out_of_window | 4 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 21 |
| darkreading | 13 |
| bleepingcomputer | 10 |
| arstechnica_sec | 8 |
| thehackernews | 7 |
| securityweek | 6 |
| cyberscoop | 4 |
| therecord | 3 |
| riskybiz | 1 |
| schneier | 1 |
