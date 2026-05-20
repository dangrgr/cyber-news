# Run summary — last 7 days

Generated at 2026-05-20T16:40:32.965Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 55 |
| Runs (process) | 78 |
| Articles processed | 188 |
| Articles published | 97 |
| Total cost | $1.7172 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 185 | 187957 | 26974 | $0.3228 |
| extract | 209 | 405343 | 114299 | $0.9768 |
| factcheck | 111 | 230448 | 37408 | $0.4175 |
| total | 505 | 823748 | 178681 | $1.7172 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| triage_vendor_marketing | 17 |
| factcheck_date_out_of_window | 15 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 11 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| securityweek | 20 |
| thehackernews | 15 |
| csoonline | 14 |
| cyberscoop | 10 |
| therecord | 3 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
