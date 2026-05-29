# Run summary — last 7 days

Generated at 2026-05-29T16:31:53.877Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 122 |
| Runs (ingest) | 64 |
| Runs (process) | 58 |
| Articles processed | 124 |
| Articles published | 66 |
| Total cost | $1.2143 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 124 | 124758 | 17913 | $0.2143 |
| extract | 150 | 289183 | 85537 | $0.7169 |
| factcheck | 70 | 151041 | 26407 | $0.2831 |
| total | 344 | 564982 | 129857 | $1.2143 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 21 |
| factcheck_date_out_of_window | 15 |
| triage_not_an_incident | 12 |
| factcheck_reconcile_disagree | 4 |
| factcheck_entity_not_in_article | 3 |
| factcheck_claim_overreach | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 17 |
| thehackernews | 11 |
| bleepingcomputer | 10 |
| csoonline | 10 |
| darkreading | 4 |
| cyberscoop | 2 |
| therecord | 2 |
| krebs | 1 |
| riskybiz | 1 |
