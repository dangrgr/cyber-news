# Run summary — last 7 days

Generated at 2026-05-25T14:24:01.841Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 60 |
| Runs (process) | 71 |
| Articles processed | 203 |
| Articles published | 98 |
| Total cost | $1.8040 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 201 | 202666 | 28994 | $0.3476 |
| extract | 229 | 418009 | 125358 | $1.0448 |
| factcheck | 112 | 220418 | 38225 | $0.4115 |
| total | 542 | 841093 | 192577 | $1.8040 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 20 |
| triage_vendor_marketing | 17 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 23 |
| thehackernews | 22 |
| csoonline | 19 |
| bleepingcomputer | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
