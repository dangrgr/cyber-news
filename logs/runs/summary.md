# Run summary — last 7 days

Generated at 2026-05-21T08:22:20.826Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 132 |
| Runs (ingest) | 54 |
| Runs (process) | 78 |
| Articles processed | 193 |
| Articles published | 100 |
| Total cost | $1.7799 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 190 | 193021 | 27594 | $0.3310 |
| extract | 219 | 420834 | 119581 | $1.0187 |
| factcheck | 113 | 234013 | 39222 | $0.4301 |
| total | 522 | 847868 | 186397 | $1.7799 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 31 |
| factcheck_claim_overreach | 15 |
| factcheck_date_out_of_window | 15 |
| triage_vendor_marketing | 14 |
| factcheck_reconcile_disagree | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 23 |
| securityweek | 20 |
| thehackernews | 17 |
| csoonline | 15 |
| cyberscoop | 7 |
| therecord | 4 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
