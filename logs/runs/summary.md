# Run summary — last 7 days

Generated at 2026-05-14T22:19:38.041Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 92 |
| Runs (ingest) | 41 |
| Runs (process) | 51 |
| Articles processed | 183 |
| Articles published | 77 |
| Total cost | $1.4149 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 175 | 159307 | 24253 | $0.2806 |
| extract | 169 | 330306 | 91233 | $0.7865 |
| factcheck | 86 | 187301 | 32107 | $0.3478 |
| total | 430 | 676914 | 147593 | $1.4149 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_unhandled | 22 |
| triage_not_an_incident | 16 |
| factcheck_claim_overreach | 10 |
| factcheck_reconcile_disagree | 9 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_date_out_of_window | 7 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 26 |
| bleepingcomputer | 18 |
| darkreading | 13 |
| thehackernews | 13 |
| securityweek | 11 |
| cyberscoop | 10 |
| arstechnica_sec | 8 |
| therecord | 5 |
| riskybiz | 1 |
| schneier | 1 |
