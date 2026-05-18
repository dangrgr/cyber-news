# Run summary — last 7 days

Generated at 2026-05-18T20:01:46.294Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 135 |
| Runs (ingest) | 58 |
| Runs (process) | 77 |
| Articles processed | 178 |
| Articles published | 97 |
| Total cost | $1.6335 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 176 | 178581 | 25319 | $0.3052 |
| extract | 199 | 377897 | 107703 | $0.9164 |
| factcheck | 107 | 222271 | 37937 | $0.4120 |
| total | 482 | 778749 | 170959 | $1.6335 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 27 |
| triage_vendor_marketing | 22 |
| factcheck_reconcile_disagree | 10 |
| factcheck_date_out_of_window | 9 |
| factcheck_claim_overreach | 8 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| thehackernews | 16 |
| csoonline | 15 |
| securityweek | 13 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
