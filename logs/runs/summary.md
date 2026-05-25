# Run summary — last 7 days

Generated at 2026-05-25T01:53:58.963Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 59 |
| Runs (process) | 71 |
| Articles processed | 193 |
| Articles published | 93 |
| Total cost | $1.6926 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 191 | 192744 | 27728 | $0.3314 |
| extract | 214 | 391054 | 116691 | $0.9745 |
| factcheck | 106 | 207171 | 35909 | $0.3867 |
| total | 511 | 790969 | 180328 | $1.6926 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 16 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| thehackernews | 20 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 2 |
