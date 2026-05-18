# Run summary — last 7 days

Generated at 2026-05-18T23:45:15.112Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 135 |
| Runs (ingest) | 58 |
| Runs (process) | 77 |
| Articles processed | 185 |
| Articles published | 102 |
| Total cost | $1.6773 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 183 | 185511 | 26412 | $0.3176 |
| extract | 204 | 387155 | 110239 | $0.9384 |
| factcheck | 112 | 231023 | 38067 | $0.4214 |
| total | 499 | 803689 | 174718 | $1.6773 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 29 |
| triage_vendor_marketing | 22 |
| factcheck_date_out_of_window | 10 |
| factcheck_reconcile_disagree | 10 |
| factcheck_claim_overreach | 7 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 21 |
| csoonline | 15 |
| thehackernews | 15 |
| securityweek | 13 |
| cyberscoop | 10 |
| therecord | 4 |
| darkreading | 2 |
| krebs | 1 |
| riskybiz | 1 |
| schneier | 1 |
