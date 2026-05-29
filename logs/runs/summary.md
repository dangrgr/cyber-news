# Run summary — last 7 days

Generated at 2026-05-29T08:41:08.015Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 65 |
| Runs (process) | 58 |
| Articles processed | 121 |
| Articles published | 63 |
| Total cost | $1.1611 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 121 | 121657 | 17354 | $0.2084 |
| extract | 147 | 272087 | 82038 | $0.6823 |
| factcheck | 69 | 142648 | 25557 | $0.2704 |
| total | 337 | 536392 | 124949 | $1.1611 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
| triage_not_an_incident | 13 |
| factcheck_date_out_of_window | 12 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 12 |
| bleepingcomputer | 10 |
| csoonline | 10 |
| darkreading | 3 |
| therecord | 3 |
| cyberscoop | 2 |
| krebs | 1 |
| riskybiz | 1 |
