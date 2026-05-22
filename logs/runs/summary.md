# Run summary — last 7 days

Generated at 2026-05-22T19:02:20.040Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 127 |
| Runs (ingest) | 52 |
| Runs (process) | 75 |
| Articles processed | 188 |
| Articles published | 91 |
| Total cost | $1.6519 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 186 | 187827 | 26919 | $0.3224 |
| extract | 207 | 382148 | 112607 | $0.9452 |
| factcheck | 103 | 203074 | 36236 | $0.3843 |
| total | 496 | 773049 | 175762 | $1.6519 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 36 |
| factcheck_date_out_of_window | 16 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 12 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| bleepingcomputer | 18 |
| thehackernews | 18 |
| csoonline | 17 |
| cyberscoop | 8 |
| therecord | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 1 |
