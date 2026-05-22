# Run summary — last 7 days

Generated at 2026-05-22T19:17:36.736Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 128 |
| Runs (ingest) | 52 |
| Runs (process) | 76 |
| Articles processed | 193 |
| Articles published | 94 |
| Total cost | $1.6994 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 191 | 192907 | 27684 | $0.3313 |
| extract | 214 | 393991 | 116037 | $0.9742 |
| factcheck | 106 | 208115 | 37157 | $0.3939 |
| total | 511 | 795013 | 180878 | $1.6994 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 36 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 12 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 19 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| cyberscoop | 8 |
| therecord | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
