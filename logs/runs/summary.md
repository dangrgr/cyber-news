# Run summary — last 7 days

Generated at 2026-05-22T11:18:08.436Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 53 |
| Runs (process) | 76 |
| Articles processed | 191 |
| Articles published | 93 |
| Total cost | $1.6854 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 188 | 190219 | 27149 | $0.3260 |
| extract | 210 | 392769 | 114157 | $0.9636 |
| factcheck | 107 | 212497 | 36671 | $0.3959 |
| total | 505 | 795485 | 177977 | $1.6854 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 33 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 16 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 12 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 23 |
| bleepingcomputer | 21 |
| thehackernews | 18 |
| csoonline | 14 |
| cyberscoop | 8 |
| therecord | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
