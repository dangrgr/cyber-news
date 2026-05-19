# Run summary — last 7 days

Generated at 2026-05-19T18:26:15.737Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 56 |
| Runs (process) | 76 |
| Articles processed | 183 |
| Articles published | 98 |
| Total cost | $1.6817 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 180 | 183484 | 26314 | $0.3151 |
| extract | 202 | 388022 | 111178 | $0.9439 |
| factcheck | 112 | 233587 | 37826 | $0.4227 |
| total | 494 | 805093 | 175318 | $1.6817 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| triage_vendor_marketing | 19 |
| factcheck_reconcile_disagree | 14 |
| factcheck_date_out_of_window | 10 |
| factcheck_claim_overreach | 7 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| csoonline | 15 |
| thehackernews | 15 |
| securityweek | 14 |
| cyberscoop | 9 |
| therecord | 3 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
