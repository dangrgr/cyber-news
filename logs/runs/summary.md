# Run summary — last 7 days

Generated at 2026-06-02T23:32:23.716Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 104 |
| Runs (ingest) | 57 |
| Runs (process) | 47 |
| Articles processed | 78 |
| Articles published | 42 |
| Total cost | $0.8052 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 78 | 78670 | 11371 | $0.1355 |
| extract | 97 | 198191 | 55993 | $0.4782 |
| factcheck | 45 | 104962 | 17321 | $0.1916 |
| total | 220 | 381823 | 84685 | $0.8052 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 10 |
| triage_vendor_marketing | 10 |
| factcheck_date_out_of_window | 9 |
| factcheck_reconcile_disagree | 3 |
| factcheck_claim_overreach | 2 |
| factcheck_entity_not_in_article | 1 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 11 |
| csoonline | 8 |
| bleepingcomputer | 6 |
| thehackernews | 6 |
| cyberscoop | 2 |
| darkreading | 2 |
| therecord | 1 |
