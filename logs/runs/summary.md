# Run summary — last 7 days

Generated at 2026-05-21T04:30:21.472Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 55 |
| Runs (process) | 77 |
| Articles processed | 185 |
| Articles published | 95 |
| Total cost | $1.7056 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 182 | 184809 | 26508 | $0.3173 |
| extract | 209 | 402990 | 114885 | $0.9774 |
| factcheck | 108 | 224586 | 37243 | $0.4108 |
| total | 499 | 812385 | 178636 | $1.7056 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| factcheck_date_out_of_window | 15 |
| factcheck_claim_overreach | 14 |
| triage_vendor_marketing | 14 |
| factcheck_reconcile_disagree | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| securityweek | 20 |
| thehackernews | 16 |
| csoonline | 14 |
| cyberscoop | 7 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
