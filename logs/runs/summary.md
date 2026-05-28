# Run summary — last 7 days

Generated at 2026-05-28T23:56:34.764Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 65 |
| Runs (process) | 58 |
| Articles processed | 120 |
| Articles published | 63 |
| Total cost | $1.1405 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 120 | 120472 | 17144 | $0.2062 |
| extract | 146 | 260707 | 80847 | $0.6649 |
| factcheck | 69 | 140534 | 25771 | $0.2694 |
| total | 335 | 521713 | 123762 | $1.1405 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 18 |
| triage_not_an_incident | 15 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 12 |
| csoonline | 9 |
| bleepingcomputer | 8 |
| therecord | 4 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 2 |
| krebs | 1 |
