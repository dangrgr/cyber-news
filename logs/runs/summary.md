# Run summary — last 7 days

Generated at 2026-05-19T22:38:27.728Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 57 |
| Runs (process) | 77 |
| Articles processed | 187 |
| Articles published | 97 |
| Total cost | $1.7092 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 184 | 186867 | 26990 | $0.3218 |
| extract | 207 | 397366 | 113597 | $0.9654 |
| factcheck | 111 | 231242 | 38157 | $0.4220 |
| total | 502 | 815475 | 178744 | $1.7092 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 31 |
| triage_vendor_marketing | 17 |
| factcheck_reconcile_disagree | 14 |
| factcheck_date_out_of_window | 12 |
| factcheck_claim_overreach | 10 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| csoonline | 16 |
| securityweek | 16 |
| thehackernews | 15 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
