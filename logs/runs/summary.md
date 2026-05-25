# Run summary — last 7 days

Generated at 2026-05-25T21:53:25.254Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 61 |
| Runs (process) | 71 |
| Articles processed | 177 |
| Articles published | 84 |
| Total cost | $1.5774 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 176 | 177600 | 25424 | $0.3047 |
| extract | 200 | 369283 | 110065 | $0.9196 |
| factcheck | 95 | 187638 | 33091 | $0.3531 |
| total | 471 | 734521 | 168580 | $1.5774 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 28 |
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
| darkreading | 2 |
| krebs | 2 |
