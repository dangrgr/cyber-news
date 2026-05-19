# Run summary — last 7 days

Generated at 2026-05-19T13:48:44.973Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 56 |
| Runs (process) | 77 |
| Articles processed | 185 |
| Articles published | 102 |
| Total cost | $1.6758 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 182 | 185146 | 26291 | $0.3166 |
| extract | 205 | 386148 | 110626 | $0.9393 |
| factcheck | 113 | 231545 | 37685 | $0.4200 |
| total | 500 | 802839 | 174602 | $1.6758 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 27 |
| triage_vendor_marketing | 21 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 11 |
| factcheck_claim_overreach | 7 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 22 |
| thehackernews | 15 |
| csoonline | 14 |
| securityweek | 14 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
