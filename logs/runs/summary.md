# Run summary — last 7 days

Generated at 2026-05-31T05:11:00.342Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 117 |
| Runs (ingest) | 63 |
| Runs (process) | 54 |
| Articles processed | 107 |
| Articles published | 54 |
| Total cost | $1.0567 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 107 | 108109 | 15492 | $0.1856 |
| extract | 128 | 254977 | 73461 | $0.6223 |
| factcheck | 59 | 132150 | 23343 | $0.2489 |
| total | 294 | 495236 | 112296 | $1.0567 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 13 |
| triage_not_an_incident | 11 |
| factcheck_reconcile_disagree | 5 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 17 |
| bleepingcomputer | 10 |
| thehackernews | 10 |
| csoonline | 9 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 1 |
| therecord | 1 |
