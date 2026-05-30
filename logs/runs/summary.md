# Run summary — last 7 days

Generated at 2026-05-30T09:32:56.369Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 118 |
| Runs (ingest) | 63 |
| Runs (process) | 55 |
| Articles processed | 111 |
| Articles published | 58 |
| Total cost | $1.0926 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 111 | 112083 | 16033 | $0.1922 |
| extract | 133 | 260381 | 76698 | $0.6439 |
| factcheck | 62 | 136533 | 23996 | $0.2565 |
| total | 306 | 508997 | 116727 | $1.0926 |

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
