# Run summary — last 7 days

Generated at 2026-05-18T22:40:22.900Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 135 |
| Runs (ingest) | 58 |
| Runs (process) | 77 |
| Articles processed | 184 |
| Articles published | 101 |
| Total cost | $1.6693 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 182 | 184459 | 26216 | $0.3155 |
| extract | 203 | 385633 | 109731 | $0.9343 |
| factcheck | 111 | 229301 | 38042 | $0.4195 |
| total | 496 | 799393 | 173989 | $1.6693 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| triage_vendor_marketing | 22 |
| factcheck_date_out_of_window | 10 |
| factcheck_reconcile_disagree | 10 |
| factcheck_claim_overreach | 7 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| csoonline | 15 |
| thehackernews | 15 |
| securityweek | 13 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
