# Run summary — last 7 days

Generated at 2026-05-23T17:43:29.488Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 56 |
| Runs (process) | 73 |
| Articles processed | 197 |
| Articles published | 97 |
| Total cost | $1.7546 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 195 | 196909 | 28320 | $0.3385 |
| extract | 222 | 406083 | 120723 | $1.0097 |
| factcheck | 110 | 215337 | 38217 | $0.4064 |
| total | 527 | 818329 | 187260 | $1.7546 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 16 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 20 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
