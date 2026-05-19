# Run summary — last 7 days

Generated at 2026-05-19T04:31:57.366Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 57 |
| Runs (process) | 77 |
| Articles processed | 183 |
| Articles published | 100 |
| Total cost | $1.6452 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 181 | 183954 | 26151 | $0.3147 |
| extract | 200 | 378551 | 108097 | $0.9190 |
| factcheck | 110 | 226295 | 37022 | $0.4114 |
| total | 491 | 788800 | 171270 | $1.6452 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| triage_vendor_marketing | 22 |
| factcheck_date_out_of_window | 10 |
| factcheck_reconcile_disagree | 10 |
| factcheck_claim_overreach | 7 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| csoonline | 15 |
| thehackernews | 15 |
| securityweek | 13 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
