# Run summary — last 7 days

Generated at 2026-05-11T12:25:51.207Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 35 |
| Runs (ingest) | 14 |
| Runs (process) | 21 |
| Articles processed | 59 |
| Articles published | 15 |
| Total cost | $0.3052 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 51 | 38576 | 6567 | $0.0714 |
| extract | 37 | 76874 | 18453 | $0.1691 |
| factcheck | 17 | 37169 | 5487 | $0.0646 |
| total | 105 | 152619 | 30507 | $0.3052 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 20 |
| pattern_schema_invalid | 8 |
| factcheck_invalid_cve | 7 |
| triage_vendor_marketing | 4 |
| factcheck_claim_overreach | 2 |
| factcheck_reconcile_disagree | 2 |
| factcheck_date_out_of_window | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 15 |
| darkreading | 12 |
| arstechnica_sec | 8 |
| securityweek | 3 |
| bleepingcomputer | 2 |
| cyberscoop | 1 |
| riskybiz | 1 |
| schneier | 1 |
| thehackernews | 1 |
