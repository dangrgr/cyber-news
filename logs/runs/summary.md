# Run summary — last 7 days

Generated at 2026-05-14T19:25:25.902Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 88 |
| Runs (ingest) | 39 |
| Runs (process) | 49 |
| Articles processed | 172 |
| Articles published | 72 |
| Total cost | $1.3286 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 164 | 148228 | 22743 | $0.2619 |
| extract | 158 | 310174 | 85697 | $0.7387 |
| factcheck | 80 | 175862 | 30424 | $0.3280 |
| total | 402 | 634264 | 138864 | $1.3286 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 24 |
| triage_unhandled | 22 |
| triage_not_an_incident | 13 |
| factcheck_claim_overreach | 8 |
| factcheck_invalid_cve | 8 |
| factcheck_reconcile_disagree | 8 |
| pattern_schema_invalid | 8 |
| factcheck_date_out_of_window | 7 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| csoonline | 26 |
| bleepingcomputer | 16 |
| darkreading | 13 |
| thehackernews | 12 |
| securityweek | 11 |
| arstechnica_sec | 8 |
| cyberscoop | 8 |
| therecord | 4 |
| riskybiz | 1 |
| schneier | 1 |
