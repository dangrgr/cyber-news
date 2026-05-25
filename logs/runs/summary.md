# Run summary — last 7 days

Generated at 2026-05-25T16:53:29.824Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 60 |
| Runs (process) | 71 |
| Articles processed | 188 |
| Articles published | 89 |
| Total cost | $1.6589 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 187 | 188367 | 27016 | $0.3234 |
| extract | 209 | 388700 | 115923 | $0.9683 |
| factcheck | 100 | 197317 | 33965 | $0.3671 |
| total | 496 | 774384 | 176904 | $1.6589 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 33 |
| factcheck_date_out_of_window | 20 |
| triage_vendor_marketing | 16 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 11 |
| factcheck_entity_not_in_article | 4 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 20 |
| csoonline | 18 |
| bleepingcomputer | 16 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
