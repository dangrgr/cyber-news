# Run summary — last 7 days

Generated at 2026-05-18T12:06:46.183Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 57 |
| Runs (process) | 77 |
| Articles processed | 182 |
| Articles published | 96 |
| Total cost | $1.6912 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 181 | 176778 | 25782 | $0.3057 |
| extract | 202 | 395998 | 111247 | $0.9522 |
| factcheck | 106 | 232623 | 40139 | $0.4333 |
| total | 489 | 805399 | 177168 | $1.6912 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_not_an_incident | 21 |
| factcheck_claim_overreach | 12 |
| factcheck_reconcile_disagree | 10 |
| factcheck_date_out_of_window | 8 |
| triage_unhandled | 6 |
| factcheck_invalid_cve | 2 |
| factcheck_entity_not_in_article | 1 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 22 |
| csoonline | 16 |
| securityweek | 15 |
| thehackernews | 13 |
| cyberscoop | 11 |
| therecord | 5 |
| schneier | 2 |
| darkreading | 1 |
| riskybiz | 1 |
