# Run summary — last 7 days

Generated at 2026-05-17T12:05:09.424Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 136 |
| Runs (ingest) | 59 |
| Runs (process) | 77 |
| Articles processed | 222 |
| Articles published | 103 |
| Total cost | $1.8110 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 213 | 198064 | 29593 | $0.3460 |
| extract | 219 | 428419 | 117186 | $1.0143 |
| factcheck | 114 | 246257 | 40872 | $0.4506 |
| total | 546 | 872740 | 187651 | $1.8110 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 26 |
| triage_unhandled | 22 |
| triage_not_an_incident | 20 |
| factcheck_claim_overreach | 12 |
| factcheck_reconcile_disagree | 11 |
| factcheck_date_out_of_window | 9 |
| pattern_schema_invalid | 9 |
| factcheck_invalid_cve | 8 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 28 |
| bleepingcomputer | 23 |
| securityweek | 14 |
| thehackernews | 14 |
| darkreading | 13 |
| cyberscoop | 11 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
