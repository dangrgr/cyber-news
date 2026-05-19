# Run summary — last 7 days

Generated at 2026-05-19T17:15:52.187Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 56 |
| Runs (process) | 77 |
| Articles processed | 189 |
| Articles published | 102 |
| Total cost | $1.7258 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 186 | 189554 | 27179 | $0.3254 |
| extract | 208 | 396985 | 113879 | $0.9664 |
| factcheck | 116 | 240189 | 38761 | $0.4340 |
| total | 510 | 826728 | 179819 | $1.7258 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| triage_vendor_marketing | 21 |
| factcheck_reconcile_disagree | 14 |
| factcheck_date_out_of_window | 10 |
| factcheck_claim_overreach | 7 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 25 |
| csoonline | 15 |
| thehackernews | 15 |
| securityweek | 14 |
| cyberscoop | 10 |
| therecord | 3 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
