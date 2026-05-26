# Run summary — last 7 days

Generated at 2026-05-26T22:56:52.001Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 126 |
| Runs (ingest) | 62 |
| Runs (process) | 64 |
| Articles processed | 149 |
| Articles published | 73 |
| Total cost | $1.3339 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 149 | 150163 | 21135 | $0.2558 |
| extract | 170 | 310767 | 93183 | $0.7767 |
| factcheck | 80 | 157420 | 28798 | $0.3014 |
| total | 399 | 618350 | 143116 | $1.3339 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 22 |
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 15 |
| factcheck_claim_overreach | 9 |
| factcheck_reconcile_disagree | 7 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 19 |
| thehackernews | 17 |
| bleepingcomputer | 12 |
| csoonline | 10 |
| therecord | 6 |
| cyberscoop | 4 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 1 |
