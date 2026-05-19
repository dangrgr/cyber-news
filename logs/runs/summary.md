# Run summary — last 7 days

Generated at 2026-05-19T19:18:57.772Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 56 |
| Runs (process) | 77 |
| Articles processed | 188 |
| Articles published | 98 |
| Total cost | $1.7099 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 185 | 188581 | 27105 | $0.3241 |
| extract | 206 | 394466 | 113065 | $0.9598 |
| factcheck | 113 | 235212 | 38156 | $0.4260 |
| total | 504 | 818259 | 178326 | $1.7099 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 30 |
| triage_vendor_marketing | 20 |
| factcheck_reconcile_disagree | 15 |
| factcheck_date_out_of_window | 10 |
| factcheck_claim_overreach | 9 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 26 |
| securityweek | 16 |
| csoonline | 15 |
| thehackernews | 15 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
