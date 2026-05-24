# Run summary — last 7 days

Generated at 2026-05-24T20:02:58.920Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 60 |
| Runs (process) | 71 |
| Articles processed | 194 |
| Articles published | 94 |
| Total cost | $1.7097 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 192 | 193794 | 27945 | $0.3335 |
| extract | 216 | 395010 | 117877 | $0.9844 |
| factcheck | 107 | 209402 | 36478 | $0.3918 |
| total | 515 | 798206 | 182300 | $1.7097 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 16 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 20 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
