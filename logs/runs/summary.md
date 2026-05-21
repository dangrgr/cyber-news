# Run summary — last 7 days

Generated at 2026-05-21T04:43:55.088Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 55 |
| Runs (process) | 78 |
| Articles processed | 187 |
| Articles published | 97 |
| Total cost | $1.7327 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 184 | 186841 | 26800 | $0.3208 |
| extract | 213 | 410292 | 116580 | $0.9932 |
| factcheck | 110 | 228462 | 38040 | $0.4187 |
| total | 507 | 825595 | 181420 | $1.7327 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| factcheck_date_out_of_window | 15 |
| factcheck_claim_overreach | 14 |
| triage_vendor_marketing | 14 |
| factcheck_reconcile_disagree | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| securityweek | 20 |
| thehackernews | 16 |
| csoonline | 14 |
| cyberscoop | 7 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
