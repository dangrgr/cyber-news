# Run summary — last 7 days

Generated at 2026-05-18T19:11:21.976Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 58 |
| Runs (process) | 76 |
| Articles processed | 174 |
| Articles published | 95 |
| Total cost | $1.6006 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 172 | 174597 | 24765 | $0.2984 |
| extract | 195 | 370557 | 105550 | $0.8983 |
| factcheck | 105 | 218139 | 37138 | $0.4038 |
| total | 472 | 763293 | 167453 | $1.6006 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 25 |
| triage_vendor_marketing | 22 |
| factcheck_reconcile_disagree | 10 |
| factcheck_date_out_of_window | 9 |
| factcheck_claim_overreach | 8 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 20 |
| thehackernews | 16 |
| csoonline | 14 |
| securityweek | 13 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
