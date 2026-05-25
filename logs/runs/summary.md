# Run summary — last 7 days

Generated at 2026-05-25T20:26:41.571Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 61 |
| Runs (process) | 70 |
| Articles processed | 180 |
| Articles published | 86 |
| Total cost | $1.5943 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 179 | 180374 | 25882 | $0.3098 |
| extract | 202 | 372625 | 110984 | $0.9275 |
| factcheck | 97 | 191313 | 33141 | $0.3570 |
| total | 478 | 744312 | 170007 | $1.5943 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| factcheck_date_out_of_window | 19 |
| triage_vendor_marketing | 17 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 11 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 20 |
| thehackernews | 18 |
| bleepingcomputer | 16 |
| csoonline | 16 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
