# Run summary — last 7 days

Generated at 2026-05-19T15:46:59.110Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 56 |
| Runs (process) | 76 |
| Articles processed | 177 |
| Articles published | 98 |
| Total cost | $1.6030 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 174 | 177048 | 25205 | $0.3031 |
| extract | 194 | 368263 | 105409 | $0.8953 |
| factcheck | 109 | 224529 | 36022 | $0.4046 |
| total | 477 | 769840 | 166636 | $1.6030 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 27 |
| triage_vendor_marketing | 20 |
| factcheck_reconcile_disagree | 11 |
| factcheck_date_out_of_window | 9 |
| factcheck_claim_overreach | 6 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 22 |
| thehackernews | 14 |
| csoonline | 13 |
| securityweek | 13 |
| cyberscoop | 9 |
| therecord | 3 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
