# Run summary — last 7 days

Generated at 2026-05-15T18:12:21.304Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 108 |
| Runs (ingest) | 49 |
| Runs (process) | 59 |
| Articles processed | 210 |
| Articles published | 94 |
| Total cost | $1.6798 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 201 | 185667 | 27905 | $0.3252 |
| extract | 202 | 398197 | 108344 | $0.9399 |
| factcheck | 104 | 226396 | 37655 | $0.4147 |
| total | 507 | 810260 | 173904 | $1.6798 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 26 |
| triage_unhandled | 22 |
| triage_not_an_incident | 19 |
| factcheck_claim_overreach | 11 |
| factcheck_reconcile_disagree | 10 |
| factcheck_date_out_of_window | 9 |
| pattern_schema_invalid | 9 |
| factcheck_invalid_cve | 8 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 28 |
| bleepingcomputer | 21 |
| securityweek | 14 |
| thehackernews | 14 |
| darkreading | 13 |
| cyberscoop | 10 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
