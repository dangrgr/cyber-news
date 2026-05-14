# Run summary — last 7 days

Generated at 2026-05-14T17:27:41.102Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 86 |
| Runs (ingest) | 38 |
| Runs (process) | 48 |
| Articles processed | 170 |
| Articles published | 71 |
| Total cost | $1.2710 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 162 | 146101 | 22375 | $0.2580 |
| extract | 154 | 297114 | 82045 | $0.7073 |
| factcheck | 78 | 164552 | 28218 | $0.3056 |
| total | 394 | 607767 | 132638 | $1.2710 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_unhandled | 22 |
| triage_not_an_incident | 13 |
| factcheck_claim_overreach | 8 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_date_out_of_window | 7 |
| factcheck_reconcile_disagree | 7 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 26 |
| bleepingcomputer | 16 |
| darkreading | 13 |
| securityweek | 11 |
| thehackernews | 11 |
| arstechnica_sec | 8 |
| cyberscoop | 8 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
