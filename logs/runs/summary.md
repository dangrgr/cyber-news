# Run summary — last 7 days

Generated at 2026-05-21T18:11:30.930Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 53 |
| Runs (process) | 77 |
| Articles processed | 197 |
| Articles published | 98 |
| Total cost | $1.7938 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 194 | 196909 | 28117 | $0.3375 |
| extract | 218 | 425237 | 120920 | $1.0298 |
| factcheck | 112 | 233068 | 38681 | $0.4265 |
| total | 524 | 855214 | 187718 | $1.7938 |

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
