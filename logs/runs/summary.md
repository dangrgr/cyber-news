# Run summary — last 7 days

Generated at 2026-05-20T22:06:45.078Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 55 |
| Runs (process) | 77 |
| Articles processed | 187 |
| Articles published | 94 |
| Total cost | $1.7083 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 184 | 186818 | 26730 | $0.3205 |
| extract | 209 | 403655 | 115011 | $0.9787 |
| factcheck | 108 | 224444 | 36945 | $0.4092 |
| total | 501 | 814917 | 178686 | $1.7083 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 31 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 14 |
| factcheck_reconcile_disagree | 14 |
| triage_vendor_marketing | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| securityweek | 20 |
| thehackernews | 16 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 4 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
