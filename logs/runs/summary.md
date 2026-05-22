# Run summary — last 7 days

Generated at 2026-05-22T01:35:58.444Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 52 |
| Runs (process) | 77 |
| Articles processed | 191 |
| Articles published | 96 |
| Total cost | $1.7120 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 188 | 190588 | 27129 | $0.3262 |
| extract | 211 | 404871 | 115509 | $0.9824 |
| factcheck | 108 | 219991 | 36663 | $0.4033 |
| total | 507 | 815450 | 179301 | $1.7120 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 33 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 12 |
| factcheck_reconcile_disagree | 12 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 22 |
| bleepingcomputer | 21 |
| thehackernews | 17 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 5 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
