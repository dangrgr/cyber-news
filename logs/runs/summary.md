# Run summary — last 7 days

Generated at 2026-05-22T05:50:02.052Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 52 |
| Runs (process) | 77 |
| Articles processed | 192 |
| Articles published | 95 |
| Total cost | $1.6887 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 189 | 191558 | 27269 | $0.3279 |
| extract | 209 | 393683 | 114391 | $0.9656 |
| factcheck | 107 | 214159 | 36197 | $0.3951 |
| total | 505 | 799400 | 177857 | $1.6887 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 12 |
| factcheck_reconcile_disagree | 12 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 22 |
| bleepingcomputer | 21 |
| thehackernews | 17 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
