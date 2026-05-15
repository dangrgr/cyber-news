# Run summary — last 7 days

Generated at 2026-05-15T13:05:01.187Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 103 |
| Runs (ingest) | 46 |
| Runs (process) | 57 |
| Articles processed | 197 |
| Articles published | 85 |
| Total cost | $1.5423 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 188 | 172767 | 26124 | $0.3034 |
| extract | 184 | 363949 | 99101 | $0.8595 |
| factcheck | 94 | 206668 | 34566 | $0.3795 |
| total | 466 | 743384 | 159791 | $1.5423 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_unhandled | 22 |
| triage_not_an_incident | 19 |
| factcheck_claim_overreach | 11 |
| factcheck_reconcile_disagree | 9 |
| pattern_schema_invalid | 9 |
| factcheck_date_out_of_window | 8 |
| factcheck_invalid_cve | 8 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 28 |
| bleepingcomputer | 19 |
| darkreading | 13 |
| securityweek | 13 |
| thehackernews | 13 |
| cyberscoop | 10 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
