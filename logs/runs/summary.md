# Run summary — last 7 days

Generated at 2026-05-22T16:36:47.908Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 128 |
| Runs (ingest) | 52 |
| Runs (process) | 76 |
| Articles processed | 190 |
| Articles published | 92 |
| Total cost | $1.6789 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 188 | 190311 | 27273 | $0.3267 |
| extract | 210 | 388361 | 114623 | $0.9615 |
| factcheck | 106 | 208871 | 36379 | $0.3908 |
| total | 504 | 787543 | 178275 | $1.6789 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 14 |
| factcheck_reconcile_disagree | 14 |
| triage_vendor_marketing | 14 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| securityweek | 21 |
| thehackernews | 18 |
| csoonline | 16 |
| cyberscoop | 8 |
| therecord | 7 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
