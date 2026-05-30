# Run summary — last 7 days

Generated at 2026-05-30T11:05:05.010Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 118 |
| Runs (ingest) | 63 |
| Runs (process) | 55 |
| Articles processed | 109 |
| Articles published | 56 |
| Total cost | $1.0724 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 109 | 109914 | 15724 | $0.1885 |
| extract | 130 | 255995 | 75278 | $0.6324 |
| factcheck | 60 | 133200 | 23665 | $0.2515 |
| total | 299 | 499109 | 114667 | $1.0724 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 4 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 11 |
| bleepingcomputer | 10 |
| csoonline | 9 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 1 |
| therecord | 1 |
