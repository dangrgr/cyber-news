# Run summary — last 7 days

Generated at 2026-05-22T21:00:43.980Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 128 |
| Runs (ingest) | 52 |
| Runs (process) | 76 |
| Articles processed | 191 |
| Articles published | 92 |
| Total cost | $1.6799 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 189 | 190861 | 27415 | $0.3279 |
| extract | 211 | 389264 | 115060 | $0.9646 |
| factcheck | 105 | 206708 | 36143 | $0.3874 |
| total | 505 | 786833 | 178618 | $1.6799 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 19 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
