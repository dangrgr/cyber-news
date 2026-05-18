# Run summary — last 7 days

Generated at 2026-05-18T12:50:33.195Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 58 |
| Runs (process) | 76 |
| Articles processed | 171 |
| Articles published | 93 |
| Total cost | $1.6260 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 170 | 167998 | 24397 | $0.2900 |
| extract | 194 | 381077 | 106865 | $0.9154 |
| factcheck | 103 | 225706 | 38984 | $0.4206 |
| total | 467 | 774781 | 170246 | $1.6260 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 23 |
| triage_not_an_incident | 21 |
| factcheck_claim_overreach | 10 |
| factcheck_reconcile_disagree | 10 |
| factcheck_date_out_of_window | 8 |
| triage_unhandled | 2 |
| factcheck_entity_not_in_article | 1 |
| factcheck_invalid_cve | 1 |
| pattern_schema_invalid | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 22 |
| csoonline | 13 |
| thehackernews | 13 |
| securityweek | 12 |
| cyberscoop | 10 |
| therecord | 5 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
