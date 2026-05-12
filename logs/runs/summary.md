# Run summary — last 7 days

Generated at 2026-05-12T01:24:30.620Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 46 |
| Runs (ingest) | 19 |
| Runs (process) | 27 |
| Articles processed | 81 |
| Articles published | 26 |
| Total cost | $0.5789 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 73 | 55561 | 9649 | $0.1038 |
| extract | 67 | 145333 | 37468 | $0.3327 |
| factcheck | 31 | 76329 | 13222 | $0.1424 |
| total | 171 | 277223 | 60339 | $0.5789 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| triage_vendor_marketing | 6 |
| factcheck_claim_overreach | 5 |
| factcheck_reconcile_disagree | 5 |
| factcheck_date_out_of_window | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 16 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| bleepingcomputer | 5 |
| securityweek | 5 |
| thehackernews | 4 |
| cyberscoop | 2 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
