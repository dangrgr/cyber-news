# Run summary — last 7 days

Generated at 2026-05-16T18:03:35.457Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 57 |
| Runs (process) | 73 |
| Articles processed | 219 |
| Articles published | 100 |
| Total cost | $1.7736 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 210 | 195000 | 29231 | $0.3412 |
| extract | 214 | 419091 | 114869 | $0.9934 |
| factcheck | 111 | 240235 | 39755 | $0.4390 |
| total | 535 | 854326 | 183855 | $1.7736 |

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
