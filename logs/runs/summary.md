# Run summary — last 7 days

Generated at 2026-05-18T16:46:13.237Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 134 |
| Runs (ingest) | 58 |
| Runs (process) | 76 |
| Articles processed | 171 |
| Articles published | 96 |
| Total cost | $1.5930 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 169 | 170831 | 24289 | $0.2923 |
| extract | 195 | 368585 | 104620 | $0.8917 |
| factcheck | 106 | 220557 | 37703 | $0.4091 |
| total | 470 | 759973 | 166612 | $1.5930 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 23 |
| triage_vendor_marketing | 22 |
| factcheck_reconcile_disagree | 10 |
| factcheck_claim_overreach | 8 |
| factcheck_date_out_of_window | 8 |
| pattern_schema_invalid | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 20 |
| thehackernews | 14 |
| csoonline | 13 |
| securityweek | 12 |
| cyberscoop | 9 |
| therecord | 4 |
| darkreading | 1 |
| riskybiz | 1 |
| schneier | 1 |
