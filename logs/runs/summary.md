# Run summary — last 7 days

Generated at 2026-05-18T20:46:13.142Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 135 |
| Runs (ingest) | 59 |
| Runs (process) | 76 |
| Articles processed | 176 |
| Articles published | 96 |
| Total cost | $1.6128 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 174 | 176946 | 25047 | $0.3022 |
| extract | 196 | 373218 | 106020 | $0.9033 |
| factcheck | 106 | 220379 | 37378 | $0.4073 |
| total | 476 | 770543 | 168445 | $1.6128 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 27 |
| triage_vendor_marketing | 22 |
| factcheck_reconcile_disagree | 10 |
| factcheck_date_out_of_window | 9 |
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
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
