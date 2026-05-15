# Run summary — last 7 days

Generated at 2026-05-15T05:38:59.670Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 97 |
| Runs (ingest) | 44 |
| Runs (process) | 53 |
| Articles processed | 185 |
| Articles published | 78 |
| Total cost | $1.4375 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 177 | 161429 | 24579 | $0.2843 |
| extract | 172 | 335968 | 92870 | $0.8003 |
| factcheck | 87 | 189559 | 32661 | $0.3529 |
| total | 436 | 686956 | 150110 | $1.4375 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_unhandled | 22 |
| triage_not_an_incident | 16 |
| factcheck_claim_overreach | 11 |
| factcheck_reconcile_disagree | 9 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_date_out_of_window | 7 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 26 |
| bleepingcomputer | 19 |
| darkreading | 13 |
| thehackernews | 13 |
| securityweek | 11 |
| cyberscoop | 10 |
| arstechnica_sec | 8 |
| therecord | 5 |
| riskybiz | 1 |
| schneier | 1 |
