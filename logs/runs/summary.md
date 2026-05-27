# Run summary — last 7 days

Generated at 2026-05-27T21:10:13.566Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 123 |
| Runs (ingest) | 63 |
| Runs (process) | 60 |
| Articles processed | 129 |
| Articles published | 65 |
| Total cost | $1.1832 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 129 | 129998 | 18404 | $0.2220 |
| extract | 150 | 270144 | 82838 | $0.6843 |
| factcheck | 72 | 142600 | 26841 | $0.2768 |
| total | 351 | 542742 | 128083 | $1.1832 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 22 |
| triage_vendor_marketing | 17 |
| factcheck_date_out_of_window | 11 |
| factcheck_reconcile_disagree | 7 |
| factcheck_claim_overreach | 3 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| thehackernews | 15 |
| securityweek | 14 |
| csoonline | 10 |
| bleepingcomputer | 8 |
| therecord | 6 |
| cyberscoop | 4 |
| darkreading | 3 |
| riskybiz | 3 |
| krebs | 1 |
