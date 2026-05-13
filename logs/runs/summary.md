# Run summary — last 7 days

Generated at 2026-05-13T20:24:44.043Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 74 |
| Runs (ingest) | 34 |
| Runs (process) | 40 |
| Articles processed | 146 |
| Articles published | 57 |
| Total cost | $1.0651 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 138 | 121628 | 18871 | $0.2160 |
| extract | 128 | 250177 | 68566 | $0.5930 |
| factcheck | 63 | 136658 | 23885 | $0.2561 |
| total | 329 | 508463 | 111322 | $1.0651 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| triage_vendor_marketing | 22 |
| triage_not_an_incident | 9 |
| factcheck_claim_overreach | 8 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_reconcile_disagree | 6 |
| factcheck_date_out_of_window | 5 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 24 |
| bleepingcomputer | 13 |
| darkreading | 13 |
| securityweek | 10 |
| thehackernews | 10 |
| arstechnica_sec | 8 |
| cyberscoop | 5 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
