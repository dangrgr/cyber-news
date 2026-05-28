# Run summary — last 7 days

Generated at 2026-05-28T08:33:33.260Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 64 |
| Runs (process) | 59 |
| Articles processed | 118 |
| Articles published | 60 |
| Total cost | $1.1002 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 118 | 118484 | 16901 | $0.2030 |
| extract | 139 | 253411 | 77680 | $0.6418 |
| factcheck | 67 | 134208 | 24240 | $0.2554 |
| total | 324 | 506103 | 118821 | $1.1002 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 19 |
| triage_vendor_marketing | 15 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 7 |
| factcheck_entity_not_in_article | 3 |
| factcheck_claim_overreach | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 14 |
| thehackernews | 13 |
| csoonline | 9 |
| bleepingcomputer | 8 |
| therecord | 5 |
| cyberscoop | 3 |
| darkreading | 3 |
| riskybiz | 2 |
| krebs | 1 |
