# Run summary — last 7 days

Generated at 2026-05-20T23:55:31.365Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 54 |
| Runs (process) | 78 |
| Articles processed | 186 |
| Articles published | 95 |
| Total cost | $1.7126 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 183 | 185835 | 26632 | $0.3190 |
| extract | 210 | 405658 | 115428 | $0.9828 |
| factcheck | 108 | 224586 | 37243 | $0.4108 |
| total | 501 | 816079 | 179303 | $1.7126 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| factcheck_date_out_of_window | 16 |
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
| csoonline | 15 |
| cyberscoop | 7 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
