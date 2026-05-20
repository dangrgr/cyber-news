# Run summary — last 7 days

Generated at 2026-05-20T22:45:04.072Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 55 |
| Runs (process) | 78 |
| Articles processed | 190 |
| Articles published | 96 |
| Total cost | $1.7396 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 187 | 189889 | 27167 | $0.3257 |
| extract | 213 | 410617 | 117109 | $0.9962 |
| factcheck | 110 | 228322 | 37877 | $0.4177 |
| total | 510 | 828828 | 182153 | $1.7396 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 31 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 14 |
| factcheck_reconcile_disagree | 14 |
| triage_vendor_marketing | 14 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| securityweek | 20 |
| thehackernews | 16 |
| csoonline | 15 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
