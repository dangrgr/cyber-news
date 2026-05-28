# Run summary — last 7 days

Generated at 2026-05-28T12:42:21.936Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 125 |
| Runs (ingest) | 66 |
| Runs (process) | 59 |
| Articles processed | 109 |
| Articles published | 57 |
| Total cost | $1.0554 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 109 | 109356 | 15644 | $0.1876 |
| extract | 134 | 245745 | 75205 | $0.6218 |
| factcheck | 64 | 129002 | 23405 | $0.2460 |
| total | 307 | 484103 | 114254 | $1.0554 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 16 |
| triage_vendor_marketing | 13 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 7 |
| factcheck_entity_not_in_article | 3 |
| factcheck_claim_overreach | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| thehackernews | 12 |
| securityweek | 11 |
| bleepingcomputer | 8 |
| csoonline | 8 |
| therecord | 5 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 2 |
| krebs | 1 |
