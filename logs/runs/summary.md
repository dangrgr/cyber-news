# Run summary — last 7 days

Generated at 2026-05-18T04:25:56.454Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 135 |
| Runs (ingest) | 59 |
| Runs (process) | 76 |
| Articles processed | 179 |
| Articles published | 95 |
| Total cost | $1.6297 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 178 | 172994 | 25221 | $0.2991 |
| extract | 197 | 379417 | 107200 | $0.9154 |
| factcheck | 104 | 224222 | 38184 | $0.4151 |
| total | 479 | 776633 | 170605 | $1.6297 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 23 |
| triage_not_an_incident | 20 |
| factcheck_claim_overreach | 12 |
| factcheck_reconcile_disagree | 9 |
| factcheck_date_out_of_window | 8 |
| triage_unhandled | 7 |
| factcheck_invalid_cve | 2 |
| factcheck_entity_not_in_article | 1 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| csoonline | 16 |
| securityweek | 14 |
| thehackernews | 13 |
| cyberscoop | 11 |
| therecord | 5 |
| schneier | 2 |
| darkreading | 1 |
| riskybiz | 1 |
