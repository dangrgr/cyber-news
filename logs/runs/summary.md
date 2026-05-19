# Run summary — last 7 days

Generated at 2026-05-19T10:28:17.288Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 56 |
| Runs (process) | 77 |
| Articles processed | 185 |
| Articles published | 102 |
| Total cost | $1.6701 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 183 | 186132 | 26382 | $0.3180 |
| extract | 203 | 383227 | 110070 | $0.9336 |
| factcheck | 112 | 229933 | 37706 | $0.4185 |
| total | 498 | 799292 | 174158 | $1.6701 |

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
| csoonline | 16 |
| thehackernews | 14 |
| securityweek | 13 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
