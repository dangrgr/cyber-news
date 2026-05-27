# Run summary — last 7 days

Generated at 2026-05-27T16:30:20.637Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 63 |
| Runs (process) | 60 |
| Articles processed | 136 |
| Articles published | 67 |
| Total cost | $1.2271 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 136 | 137104 | 19339 | $0.2338 |
| extract | 157 | 279643 | 86208 | $0.7107 |
| factcheck | 74 | 144583 | 27609 | $0.2826 |
| total | 367 | 561330 | 133156 | $1.2271 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 22 |
| triage_vendor_marketing | 18 |
| factcheck_date_out_of_window | 12 |
| factcheck_reconcile_disagree | 7 |
| factcheck_claim_overreach | 6 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 16 |
| csoonline | 11 |
| bleepingcomputer | 10 |
| therecord | 6 |
| cyberscoop | 4 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
