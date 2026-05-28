# Run summary — last 7 days

Generated at 2026-05-28T05:07:25.577Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 64 |
| Runs (process) | 59 |
| Articles processed | 123 |
| Articles published | 62 |
| Total cost | $1.1280 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 123 | 123633 | 17568 | $0.2115 |
| extract | 143 | 258225 | 79400 | $0.6552 |
| factcheck | 69 | 136589 | 24952 | $0.2613 |
| total | 335 | 518447 | 121920 | $1.1280 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 21 |
| triage_vendor_marketing | 15 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 7 |
| factcheck_claim_overreach | 3 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 14 |
| thehackernews | 14 |
| csoonline | 10 |
| bleepingcomputer | 8 |
| therecord | 5 |
| cyberscoop | 3 |
| darkreading | 3 |
| riskybiz | 3 |
| krebs | 1 |
