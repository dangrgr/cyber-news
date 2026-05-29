# Run summary — last 7 days

Generated at 2026-05-29T08:51:56.525Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 65 |
| Runs (process) | 59 |
| Articles processed | 123 |
| Articles published | 64 |
| Total cost | $1.1846 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 123 | 123735 | 17695 | $0.2122 |
| extract | 149 | 277439 | 83649 | $0.6957 |
| factcheck | 70 | 145790 | 26183 | $0.2767 |
| total | 342 | 546964 | 127527 | $1.1846 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
| triage_not_an_incident | 14 |
| factcheck_date_out_of_window | 12 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 12 |
| csoonline | 11 |
| bleepingcomputer | 10 |
| darkreading | 3 |
| therecord | 3 |
| cyberscoop | 2 |
| krebs | 1 |
| riskybiz | 1 |
