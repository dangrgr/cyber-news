# Run summary — last 7 days

Generated at 2026-05-22T20:59:50.675Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 127 |
| Runs (ingest) | 52 |
| Runs (process) | 75 |
| Articles processed | 189 |
| Articles published | 91 |
| Total cost | $1.6565 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 187 | 188854 | 27099 | $0.3243 |
| extract | 208 | 383883 | 113312 | $0.9504 |
| factcheck | 103 | 202601 | 35825 | $0.3817 |
| total | 498 | 775338 | 176236 | $1.6565 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 12 |
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
| cyberscoop | 7 |
| therecord | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
