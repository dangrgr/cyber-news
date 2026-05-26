# Run summary — last 7 days

Generated at 2026-05-26T19:30:38.644Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 127 |
| Runs (ingest) | 62 |
| Runs (process) | 65 |
| Articles processed | 154 |
| Articles published | 77 |
| Total cost | $1.3713 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 154 | 154969 | 21840 | $0.2642 |
| extract | 176 | 320748 | 95758 | $0.7995 |
| factcheck | 83 | 161699 | 29176 | $0.3076 |
| total | 413 | 637416 | 146774 | $1.3713 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 22 |
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 10 |
| factcheck_reconcile_disagree | 6 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 19 |
| thehackernews | 17 |
| bleepingcomputer | 11 |
| csoonline | 11 |
| therecord | 7 |
| cyberscoop | 5 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
