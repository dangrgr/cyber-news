# Run summary — last 7 days

Generated at 2026-05-21T21:49:01.346Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 52 |
| Runs (process) | 78 |
| Articles processed | 195 |
| Articles published | 97 |
| Total cost | $1.7243 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 192 | 194429 | 27696 | $0.3329 |
| extract | 213 | 408617 | 116456 | $0.9909 |
| factcheck | 109 | 218790 | 36348 | $0.4005 |
| total | 514 | 821836 | 180500 | $1.7243 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 34 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 14 |
| factcheck_reconcile_disagree | 12 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 22 |
| securityweek | 22 |
| thehackernews | 17 |
| csoonline | 15 |
| cyberscoop | 9 |
| therecord | 6 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
