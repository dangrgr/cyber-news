# Run summary — last 7 days

Generated at 2026-06-04T20:20:15.100Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 103 |
| Runs (ingest) | 56 |
| Runs (process) | 47 |
| Articles processed | 86 |
| Articles published | 54 |
| Total cost | $0.9265 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 86 | 87861 | 12751 | $0.1516 |
| extract | 113 | 230687 | 64378 | $0.5526 |
| factcheck | 57 | 126533 | 19146 | $0.2223 |
| total | 256 | 445081 | 96275 | $0.9265 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 10 |
| factcheck_date_out_of_window | 9 |
| triage_vendor_marketing | 8 |
| factcheck_reconcile_disagree | 3 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| thehackernews | 9 |
| csoonline | 8 |
| securityweek | 5 |
| bleepingcomputer | 4 |
| cyberscoop | 2 |
| riskybiz | 2 |
| darkreading | 1 |
| schneier | 1 |
