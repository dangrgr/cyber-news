# Run summary — last 7 days

Generated at 2026-05-19T06:19:54.547Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 57 |
| Runs (process) | 77 |
| Articles processed | 183 |
| Articles published | 99 |
| Total cost | $1.6312 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 181 | 184074 | 26096 | $0.3146 |
| extract | 198 | 374105 | 107169 | $0.9100 |
| factcheck | 109 | 223937 | 36560 | $0.4067 |
| total | 488 | 782116 | 169825 | $1.6312 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| triage_vendor_marketing | 23 |
| factcheck_date_out_of_window | 10 |
| factcheck_reconcile_disagree | 10 |
| factcheck_claim_overreach | 7 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| csoonline | 16 |
| thehackernews | 15 |
| securityweek | 13 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
