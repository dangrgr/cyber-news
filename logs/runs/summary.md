# Run summary — last 7 days

Generated at 2026-05-20T10:04:58.172Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 55 |
| Runs (process) | 79 |
| Articles processed | 197 |
| Articles published | 100 |
| Total cost | $1.7814 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 194 | 197197 | 28267 | $0.3385 |
| extract | 216 | 419027 | 118213 | $1.0101 |
| factcheck | 114 | 237808 | 38990 | $0.4328 |
| total | 524 | 854032 | 185470 | $1.7814 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 32 |
| triage_vendor_marketing | 18 |
| factcheck_date_out_of_window | 14 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 25 |
| securityweek | 19 |
| csoonline | 17 |
| thehackernews | 16 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
