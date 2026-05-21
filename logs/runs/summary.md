# Run summary — last 7 days

Generated at 2026-05-21T23:40:56.431Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 53 |
| Runs (process) | 77 |
| Articles processed | 190 |
| Articles published | 95 |
| Total cost | $1.6974 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 187 | 189640 | 27029 | $0.3248 |
| extract | 209 | 402429 | 114631 | $0.9756 |
| factcheck | 107 | 216101 | 36190 | $0.3971 |
| total | 503 | 808170 | 177850 | $1.6974 |

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
