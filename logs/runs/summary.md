# Run summary — last 7 days

Generated at 2026-05-18T04:41:23.973Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 136 |
| Runs (ingest) | 59 |
| Runs (process) | 77 |
| Articles processed | 180 |
| Articles published | 95 |
| Total cost | $1.6315 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 179 | 174110 | 25364 | $0.3009 |
| extract | 197 | 379417 | 107200 | $0.9154 |
| factcheck | 104 | 224222 | 38184 | $0.4151 |
| total | 480 | 777749 | 170748 | $1.6315 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
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
| securityweek | 15 |
| thehackernews | 13 |
| cyberscoop | 11 |
| therecord | 5 |
| schneier | 2 |
| darkreading | 1 |
| riskybiz | 1 |
