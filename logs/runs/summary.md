# Run summary — last 7 days

Generated at 2026-05-19T20:30:54.679Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 57 |
| Runs (process) | 76 |
| Articles processed | 179 |
| Articles published | 93 |
| Total cost | $1.6488 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 176 | 179315 | 25860 | $0.3086 |
| extract | 198 | 382386 | 109389 | $0.9293 |
| factcheck | 107 | 225098 | 37142 | $0.4108 |
| total | 481 | 786799 | 172391 | $1.6488 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 30 |
| triage_vendor_marketing | 17 |
| factcheck_reconcile_disagree | 14 |
| factcheck_date_out_of_window | 10 |
| factcheck_claim_overreach | 9 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| securityweek | 16 |
| csoonline | 15 |
| thehackernews | 15 |
| cyberscoop | 9 |
| therecord | 3 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
