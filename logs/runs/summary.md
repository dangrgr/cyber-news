# Run summary — last 7 days

Generated at 2026-05-17T16:38:23.689Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 136 |
| Runs (ingest) | 59 |
| Runs (process) | 77 |
| Articles processed | 222 |
| Articles published | 105 |
| Total cost | $1.8238 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 213 | 198530 | 29635 | $0.3467 |
| extract | 220 | 430020 | 118193 | $1.0210 |
| factcheck | 115 | 248753 | 41466 | $0.4561 |
| total | 548 | 877303 | 189294 | $1.8238 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 26 |
| triage_unhandled | 22 |
| triage_not_an_incident | 20 |
| factcheck_claim_overreach | 12 |
| factcheck_reconcile_disagree | 10 |
| factcheck_date_out_of_window | 9 |
| pattern_schema_invalid | 9 |
| factcheck_invalid_cve | 7 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 28 |
| bleepingcomputer | 22 |
| securityweek | 14 |
| darkreading | 13 |
| thehackernews | 13 |
| cyberscoop | 11 |
| arstechnica_sec | 8 |
| therecord | 5 |
| schneier | 2 |
| riskybiz | 1 |
