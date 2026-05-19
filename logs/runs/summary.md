# Run summary — last 7 days

Generated at 2026-05-19T11:45:21.352Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 57 |
| Runs (process) | 76 |
| Articles processed | 178 |
| Articles published | 100 |
| Total cost | $1.6248 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 176 | 179065 | 25392 | $0.3060 |
| extract | 199 | 375397 | 107132 | $0.9111 |
| factcheck | 110 | 225297 | 36489 | $0.4077 |
| total | 485 | 779759 | 169013 | $1.6248 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 25 |
| triage_vendor_marketing | 21 |
| factcheck_date_out_of_window | 10 |
| factcheck_reconcile_disagree | 10 |
| factcheck_claim_overreach | 7 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| csoonline | 13 |
| securityweek | 13 |
| thehackernews | 13 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
