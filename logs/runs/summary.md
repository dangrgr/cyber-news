# Run summary — last 7 days

Generated at 2026-05-22T12:35:42.446Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 52 |
| Runs (process) | 77 |
| Articles processed | 197 |
| Articles published | 96 |
| Total cost | $1.7349 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 194 | 196327 | 27987 | $0.3363 |
| extract | 217 | 403788 | 117599 | $0.9918 |
| factcheck | 110 | 217785 | 37820 | $0.4069 |
| total | 521 | 817900 | 183406 | $1.7349 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 16 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 23 |
| bleepingcomputer | 22 |
| thehackernews | 18 |
| csoonline | 16 |
| cyberscoop | 8 |
| therecord | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
