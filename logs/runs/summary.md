# Run summary — last 7 days

Generated at 2026-06-04T23:36:24.793Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 103 |
| Runs (ingest) | 56 |
| Runs (process) | 47 |
| Articles processed | 88 |
| Articles published | 54 |
| Total cost | $0.9317 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 88 | 89858 | 12996 | $0.1548 |
| extract | 114 | 231470 | 64532 | $0.5541 |
| factcheck | 57 | 125918 | 19366 | $0.2227 |
| total | 259 | 447246 | 96894 | $0.9317 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 11 |
| factcheck_date_out_of_window | 10 |
| triage_vendor_marketing | 7 |
| factcheck_reconcile_disagree | 3 |
| triage_speculation | 2 |
| factcheck_entity_not_in_article | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| thehackernews | 9 |
| csoonline | 8 |
| bleepingcomputer | 5 |
| securityweek | 4 |
| cyberscoop | 2 |
| riskybiz | 2 |
| therecord | 2 |
| darkreading | 1 |
| schneier | 1 |
