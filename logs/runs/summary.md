# Run summary — last 7 days

Generated at 2026-06-04T21:53:20.524Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 103 |
| Runs (ingest) | 56 |
| Runs (process) | 47 |
| Articles processed | 85 |
| Articles published | 53 |
| Total cost | $0.9111 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 85 | 86811 | 12604 | $0.1498 |
| extract | 111 | 226683 | 63172 | $0.5425 |
| factcheck | 56 | 124195 | 18901 | $0.2187 |
| total | 252 | 437689 | 94677 | $0.9111 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 10 |
| factcheck_date_out_of_window | 9 |
| triage_vendor_marketing | 7 |
| factcheck_reconcile_disagree | 3 |
| triage_speculation | 2 |
| factcheck_entity_not_in_article | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| thehackernews | 9 |
| csoonline | 8 |
| bleepingcomputer | 4 |
| securityweek | 4 |
| cyberscoop | 2 |
| riskybiz | 2 |
| darkreading | 1 |
| schneier | 1 |
| therecord | 1 |
