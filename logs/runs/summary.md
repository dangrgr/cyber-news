# Run summary — last 7 days

Generated at 2026-05-20T06:19:17.750Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 56 |
| Runs (process) | 78 |
| Articles processed | 191 |
| Articles published | 97 |
| Total cost | $1.7233 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 188 | 190997 | 27527 | $0.3286 |
| extract | 209 | 404580 | 114323 | $0.9762 |
| factcheck | 111 | 230600 | 37578 | $0.4185 |
| total | 508 | 826177 | 179428 | $1.7233 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 32 |
| triage_vendor_marketing | 17 |
| factcheck_date_out_of_window | 14 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 11 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| csoonline | 17 |
| securityweek | 17 |
| thehackernews | 16 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
