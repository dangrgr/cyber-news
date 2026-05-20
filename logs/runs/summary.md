# Run summary — last 7 days

Generated at 2026-05-20T01:51:06.356Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 57 |
| Runs (process) | 77 |
| Articles processed | 187 |
| Articles published | 95 |
| Total cost | $1.6918 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 184 | 187004 | 26996 | $0.3220 |
| extract | 205 | 393800 | 112226 | $0.9549 |
| factcheck | 109 | 227278 | 37528 | $0.4149 |
| total | 498 | 808082 | 176750 | $1.6918 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 32 |
| triage_vendor_marketing | 17 |
| factcheck_reconcile_disagree | 14 |
| factcheck_date_out_of_window | 13 |
| factcheck_claim_overreach | 10 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| csoonline | 17 |
| securityweek | 17 |
| thehackernews | 15 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
