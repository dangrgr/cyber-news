# Run summary — last 7 days

Generated at 2026-05-24T12:11:01.628Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 58 |
| Runs (process) | 73 |
| Articles processed | 195 |
| Articles published | 95 |
| Total cost | $1.7341 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 193 | 194852 | 28116 | $0.3354 |
| extract | 219 | 400721 | 119756 | $0.9995 |
| factcheck | 108 | 211681 | 37503 | $0.3992 |
| total | 520 | 807254 | 185375 | $1.7341 |

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
