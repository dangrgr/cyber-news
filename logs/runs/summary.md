# Run summary — last 7 days

Generated at 2026-05-30T14:07:09.532Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 119 |
| Runs (ingest) | 64 |
| Runs (process) | 55 |
| Articles processed | 107 |
| Articles published | 54 |
| Total cost | $1.0385 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 107 | 107861 | 15406 | $0.1849 |
| extract | 126 | 248843 | 72357 | $0.6106 |
| factcheck | 58 | 128890 | 22821 | $0.2430 |
| total | 291 | 485594 | 110584 | $1.0385 |

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
