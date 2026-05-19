# Run summary — last 7 days

Generated at 2026-05-19T22:10:39.042Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 57 |
| Runs (process) | 76 |
| Articles processed | 183 |
| Articles published | 96 |
| Total cost | $1.6890 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 180 | 183110 | 26404 | $0.3151 |
| extract | 204 | 392106 | 112160 | $0.9529 |
| factcheck | 110 | 230304 | 38132 | $0.4210 |
| total | 494 | 805520 | 176696 | $1.6890 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 30 |
| triage_vendor_marketing | 17 |
| factcheck_reconcile_disagree | 14 |
| factcheck_date_out_of_window | 11 |
| factcheck_claim_overreach | 9 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| securityweek | 16 |
| csoonline | 15 |
| thehackernews | 15 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
