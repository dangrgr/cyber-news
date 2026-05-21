# Run summary — last 7 days

Generated at 2026-05-21T20:11:56.664Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 53 |
| Runs (process) | 78 |
| Articles processed | 197 |
| Articles published | 99 |
| Total cost | $1.7646 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 194 | 196766 | 28030 | $0.3369 |
| extract | 218 | 418651 | 119265 | $1.0150 |
| factcheck | 112 | 225470 | 37439 | $0.4127 |
| total | 524 | 840887 | 184734 | $1.7646 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 33 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 15 |
| triage_vendor_marketing | 15 |
| factcheck_reconcile_disagree | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| securityweek | 22 |
| thehackernews | 18 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 5 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
