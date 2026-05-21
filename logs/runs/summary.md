# Run summary — last 7 days

Generated at 2026-05-21T18:12:58.022Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 131 |
| Runs (ingest) | 53 |
| Runs (process) | 78 |
| Articles processed | 199 |
| Articles published | 100 |
| Total cost | $1.8222 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 196 | 198893 | 28398 | $0.3409 |
| extract | 222 | 431711 | 122917 | $1.0463 |
| factcheck | 114 | 236780 | 39645 | $0.4350 |
| total | 532 | 867384 | 190960 | $1.8222 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 33 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 15 |
| triage_vendor_marketing | 15 |
| factcheck_reconcile_disagree | 14 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| securityweek | 22 |
| thehackernews | 19 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 5 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
