# Run summary — last 7 days

Generated at 2026-05-21T11:53:56.562Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 54 |
| Runs (process) | 78 |
| Articles processed | 195 |
| Articles published | 98 |
| Total cost | $1.7646 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 192 | 194870 | 27757 | $0.3337 |
| extract | 216 | 414112 | 118335 | $1.0058 |
| factcheck | 111 | 229720 | 39091 | $0.4252 |
| total | 519 | 838702 | 185183 | $1.7646 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 33 |
| triage_vendor_marketing | 16 |
| factcheck_claim_overreach | 15 |
| factcheck_date_out_of_window | 14 |
| factcheck_reconcile_disagree | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 23 |
| bleepingcomputer | 22 |
| thehackernews | 18 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 4 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
