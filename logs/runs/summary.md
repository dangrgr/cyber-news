# Run summary — last 7 days

Generated at 2026-05-25T09:41:59.474Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 60 |
| Runs (process) | 70 |
| Articles processed | 189 |
| Articles published | 91 |
| Total cost | $1.6610 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 187 | 188412 | 27044 | $0.3236 |
| extract | 210 | 385136 | 114951 | $0.9599 |
| factcheck | 104 | 203897 | 34712 | $0.3775 |
| total | 501 | 777445 | 176707 | $1.6610 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 34 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 20 |
| thehackernews | 20 |
| bleepingcomputer | 17 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
