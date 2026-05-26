# Run summary — last 7 days

Generated at 2026-05-26T21:19:40.714Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 127 |
| Runs (ingest) | 62 |
| Runs (process) | 65 |
| Articles processed | 153 |
| Articles published | 74 |
| Total cost | $1.3541 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 153 | 153920 | 21721 | $0.2625 |
| extract | 173 | 316027 | 94620 | $0.7891 |
| factcheck | 81 | 158358 | 28823 | $0.3025 |
| total | 407 | 628305 | 145164 | $1.3541 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 23 |
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 10 |
| factcheck_reconcile_disagree | 7 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 19 |
| thehackernews | 17 |
| bleepingcomputer | 13 |
| csoonline | 11 |
| therecord | 6 |
| cyberscoop | 5 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 1 |
