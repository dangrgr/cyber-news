# Run summary — last 7 days

Generated at 2026-05-23T11:10:32.859Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 56 |
| Runs (process) | 73 |
| Articles processed | 193 |
| Articles published | 94 |
| Total cost | $1.7060 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 191 | 193016 | 27733 | $0.3317 |
| extract | 215 | 395527 | 116901 | $0.9800 |
| factcheck | 107 | 210194 | 36823 | $0.3943 |
| total | 513 | 798737 | 181457 | $1.7060 |

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
