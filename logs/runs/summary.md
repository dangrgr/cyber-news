# Run summary — last 7 days

Generated at 2026-05-21T15:52:27.754Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 53 |
| Runs (process) | 78 |
| Articles processed | 203 |
| Articles published | 101 |
| Total cost | $1.8449 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 200 | 203098 | 29012 | $0.3482 |
| extract | 224 | 436327 | 124555 | $1.0591 |
| factcheck | 115 | 238646 | 39805 | $0.4377 |
| total | 539 | 878071 | 193372 | $1.8449 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 34 |
| factcheck_date_out_of_window | 16 |
| triage_vendor_marketing | 16 |
| factcheck_claim_overreach | 15 |
| factcheck_reconcile_disagree | 14 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| securityweek | 23 |
| thehackernews | 20 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 5 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
