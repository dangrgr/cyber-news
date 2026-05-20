# Run summary — last 7 days

Generated at 2026-05-20T21:13:33.672Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 54 |
| Runs (process) | 78 |
| Articles processed | 190 |
| Articles published | 97 |
| Total cost | $1.7362 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 187 | 189647 | 27150 | $0.3254 |
| extract | 213 | 410019 | 116840 | $0.9942 |
| factcheck | 111 | 229397 | 37432 | $0.4166 |
| total | 511 | 829063 | 181422 | $1.7362 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 31 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 14 |
| factcheck_reconcile_disagree | 14 |
| triage_vendor_marketing | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| securityweek | 20 |
| thehackernews | 16 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
