# Run summary — last 7 days

Generated at 2026-05-19T23:19:50.443Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 57 |
| Runs (process) | 76 |
| Articles processed | 182 |
| Articles published | 94 |
| Total cost | $1.6602 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 179 | 182115 | 26288 | $0.3136 |
| extract | 201 | 386041 | 110109 | $0.9366 |
| factcheck | 108 | 224887 | 37041 | $0.4101 |
| total | 488 | 793043 | 173438 | $1.6602 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 30 |
| triage_vendor_marketing | 17 |
| factcheck_reconcile_disagree | 14 |
| factcheck_date_out_of_window | 11 |
| factcheck_claim_overreach | 10 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| csoonline | 16 |
| securityweek | 16 |
| thehackernews | 15 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 1 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
