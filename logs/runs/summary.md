# Run summary — last 7 days

Generated at 2026-05-23T16:40:18.978Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 128 |
| Runs (ingest) | 55 |
| Runs (process) | 73 |
| Articles processed | 195 |
| Articles published | 96 |
| Total cost | $1.7397 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 193 | 194819 | 28036 | $0.3350 |
| extract | 220 | 402851 | 119772 | $1.0017 |
| factcheck | 109 | 213516 | 37888 | $0.4030 |
| total | 522 | 811186 | 185696 | $1.7397 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 19 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
