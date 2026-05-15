# Run summary — last 7 days

Generated at 2026-05-15T11:06:27.829Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 101 |
| Runs (ingest) | 45 |
| Runs (process) | 56 |
| Articles processed | 192 |
| Articles published | 83 |
| Total cost | $1.5137 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 184 | 168661 | 25578 | $0.2966 |
| extract | 180 | 357386 | 97333 | $0.8441 |
| factcheck | 92 | 202898 | 34048 | $0.3731 |
| total | 456 | 728945 | 156959 | $1.5137 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_unhandled | 22 |
| triage_not_an_incident | 18 |
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
| csoonline | 28 |
| bleepingcomputer | 19 |
| darkreading | 13 |
| thehackernews | 13 |
| securityweek | 11 |
| cyberscoop | 10 |
| arstechnica_sec | 8 |
| therecord | 5 |
| riskybiz | 1 |
| schneier | 1 |
