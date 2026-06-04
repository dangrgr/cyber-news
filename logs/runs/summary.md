# Run summary — last 7 days

Generated at 2026-06-04T07:23:16.521Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 103 |
| Runs (ingest) | 56 |
| Runs (process) | 47 |
| Articles processed | 81 |
| Articles published | 47 |
| Total cost | $0.8587 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 81 | 82706 | 12003 | $0.1427 |
| extract | 102 | 213705 | 59015 | $0.5088 |
| factcheck | 50 | 118357 | 17774 | $0.2072 |
| total | 233 | 414768 | 88792 | $0.8587 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 10 |
| triage_not_an_incident | 9 |
| factcheck_date_out_of_window | 8 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 8 |
| securityweek | 8 |
| bleepingcomputer | 6 |
| thehackernews | 6 |
| cyberscoop | 2 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
| therecord | 1 |
