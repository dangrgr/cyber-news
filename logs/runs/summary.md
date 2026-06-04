# Run summary — last 7 days

Generated at 2026-06-04T17:36:47.107Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 103 |
| Runs (ingest) | 56 |
| Runs (process) | 47 |
| Articles processed | 90 |
| Articles published | 57 |
| Total cost | $0.9703 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 90 | 91783 | 13348 | $0.1585 |
| extract | 119 | 239083 | 67278 | $0.5755 |
| factcheck | 60 | 134995 | 20264 | $0.2363 |
| total | 269 | 465861 | 100890 | $0.9703 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| factcheck_date_out_of_window | 10 |
| triage_not_an_incident | 9 |
| triage_vendor_marketing | 8 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 1 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 8 |
| thehackernews | 7 |
| bleepingcomputer | 6 |
| securityweek | 5 |
| cyberscoop | 2 |
| riskybiz | 2 |
| darkreading | 1 |
| schneier | 1 |
| therecord | 1 |
