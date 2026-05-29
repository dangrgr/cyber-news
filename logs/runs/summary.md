# Run summary — last 7 days

Generated at 2026-05-29T04:37:20.517Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 65 |
| Runs (process) | 58 |
| Articles processed | 119 |
| Articles published | 61 |
| Total cost | $1.1174 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 119 | 119508 | 17042 | $0.2047 |
| extract | 143 | 256321 | 79644 | $0.6545 |
| factcheck | 67 | 134386 | 24744 | $0.2581 |
| total | 329 | 510215 | 121430 | $1.1174 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 18 |
| triage_not_an_incident | 15 |
| factcheck_date_out_of_window | 12 |
| factcheck_reconcile_disagree | 6 |
| factcheck_claim_overreach | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| thehackernews | 12 |
| bleepingcomputer | 9 |
| csoonline | 9 |
| therecord | 4 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 2 |
| krebs | 1 |
