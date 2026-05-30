# Run summary — last 7 days

Generated at 2026-05-30T15:22:23.182Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 118 |
| Runs (ingest) | 64 |
| Runs (process) | 54 |
| Articles processed | 106 |
| Articles published | 53 |
| Total cost | $1.0304 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 106 | 107078 | 15292 | $0.1835 |
| extract | 124 | 246843 | 71855 | $0.6061 |
| factcheck | 57 | 127840 | 22575 | $0.2407 |
| total | 287 | 481761 | 109722 | $1.0304 |

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
