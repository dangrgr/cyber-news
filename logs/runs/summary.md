# Run summary — last 7 days

Generated at 2026-05-29T11:54:51.690Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 65 |
| Runs (process) | 58 |
| Articles processed | 118 |
| Articles published | 62 |
| Total cost | $1.1385 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 118 | 118866 | 16981 | $0.2038 |
| extract | 142 | 268123 | 80538 | $0.6708 |
| factcheck | 66 | 139945 | 24788 | $0.2639 |
| total | 326 | 526934 | 122307 | $1.1385 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| triage_not_an_incident | 14 |
| factcheck_date_out_of_window | 12 |
| factcheck_claim_overreach | 4 |
| factcheck_reconcile_disagree | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 15 |
| thehackernews | 11 |
| bleepingcomputer | 10 |
| csoonline | 10 |
| darkreading | 3 |
| therecord | 3 |
| cyberscoop | 2 |
| krebs | 1 |
| riskybiz | 1 |
