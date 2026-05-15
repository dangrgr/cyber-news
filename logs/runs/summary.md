# Run summary — last 7 days

Generated at 2026-05-15T16:25:25.012Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 106 |
| Runs (ingest) | 48 |
| Runs (process) | 58 |
| Articles processed | 205 |
| Articles published | 91 |
| Total cost | $1.6378 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 196 | 180805 | 27204 | $0.3168 |
| extract | 196 | 388311 | 105389 | $0.9153 |
| factcheck | 100 | 220009 | 37141 | $0.4057 |
| total | 492 | 789125 | 169734 | $1.6378 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 26 |
| triage_unhandled | 22 |
| triage_not_an_incident | 19 |
| factcheck_claim_overreach | 11 |
| factcheck_reconcile_disagree | 9 |
| pattern_schema_invalid | 9 |
| factcheck_date_out_of_window | 8 |
| factcheck_invalid_cve | 8 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 28 |
| bleepingcomputer | 20 |
| thehackernews | 14 |
| darkreading | 13 |
| securityweek | 13 |
| cyberscoop | 10 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
