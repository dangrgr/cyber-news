# Run summary — last 7 days

Generated at 2026-05-27T00:20:06.537Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 125 |
| Runs (ingest) | 62 |
| Runs (process) | 63 |
| Articles processed | 147 |
| Articles published | 73 |
| Total cost | $1.3269 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 147 | 148377 | 20883 | $0.2528 |
| extract | 169 | 309135 | 92721 | $0.7727 |
| factcheck | 80 | 157420 | 28798 | $0.3014 |
| total | 396 | 614932 | 142402 | $1.3269 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 21 |
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 14 |
| factcheck_claim_overreach | 9 |
| factcheck_reconcile_disagree | 7 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 19 |
| thehackernews | 17 |
| bleepingcomputer | 11 |
| csoonline | 10 |
| therecord | 6 |
| cyberscoop | 4 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
