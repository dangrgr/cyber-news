# Run summary — last 7 days

Generated at 2026-05-30T21:14:16.955Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 118 |
| Runs (ingest) | 64 |
| Runs (process) | 54 |
| Articles processed | 108 |
| Articles published | 55 |
| Total cost | $1.0736 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 108 | 109116 | 15650 | $0.1874 |
| extract | 130 | 258943 | 74811 | $0.6330 |
| factcheck | 60 | 134516 | 23746 | $0.2532 |
| total | 298 | 502575 | 114207 | $1.0736 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 5 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 17 |
| bleepingcomputer | 10 |
| thehackernews | 10 |
| csoonline | 9 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 1 |
| therecord | 1 |
