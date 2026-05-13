# Run summary — last 7 days

Generated at 2026-05-13T11:16:19.495Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 67 |
| Runs (ingest) | 30 |
| Runs (process) | 37 |
| Articles processed | 124 |
| Articles published | 49 |
| Total cost | $0.9176 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 116 | 99253 | 15704 | $0.1778 |
| extract | 110 | 217230 | 59661 | $0.5155 |
| factcheck | 55 | 120620 | 20734 | $0.2243 |
| total | 281 | 437103 | 96099 | $0.9176 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_unhandled | 22 |
| triage_vendor_marketing | 15 |
| factcheck_invalid_cve | 8 |
| pattern_schema_invalid | 8 |
| factcheck_claim_overreach | 6 |
| factcheck_reconcile_disagree | 6 |
| triage_not_an_incident | 6 |
| factcheck_date_out_of_window | 4 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 22 |
| darkreading | 13 |
| bleepingcomputer | 10 |
| arstechnica_sec | 8 |
| thehackernews | 7 |
| securityweek | 6 |
| cyberscoop | 4 |
| therecord | 3 |
| riskybiz | 1 |
| schneier | 1 |
