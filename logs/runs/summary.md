# Run summary — last 7 days

Generated at 2026-05-29T05:00:57.505Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 65 |
| Runs (process) | 59 |
| Articles processed | 123 |
| Articles published | 63 |
| Total cost | $1.1647 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 123 | 123651 | 17659 | $0.2119 |
| extract | 147 | 272087 | 82038 | $0.6823 |
| factcheck | 69 | 142648 | 25557 | $0.2704 |
| total | 339 | 538386 | 125254 | $1.1647 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 20 |
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
| bleepingcomputer | 10 |
| csoonline | 10 |
| therecord | 4 |
| darkreading | 3 |
| cyberscoop | 2 |
| riskybiz | 2 |
| krebs | 1 |
