# Run summary — last 7 days

Generated at 2026-05-29T16:06:32.712Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 122 |
| Runs (ingest) | 65 |
| Runs (process) | 57 |
| Articles processed | 114 |
| Articles published | 60 |
| Total cost | $1.1107 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 114 | 114862 | 16420 | $0.1970 |
| extract | 137 | 264024 | 78399 | $0.6560 |
| factcheck | 64 | 138097 | 23920 | $0.2577 |
| total | 315 | 516983 | 118739 | $1.1107 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 14 |
| triage_not_an_incident | 12 |
| factcheck_reconcile_disagree | 4 |
| factcheck_entity_not_in_article | 3 |
| factcheck_claim_overreach | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| csoonline | 10 |
| thehackernews | 10 |
| bleepingcomputer | 9 |
| darkreading | 3 |
| cyberscoop | 2 |
| therecord | 2 |
| krebs | 1 |
| riskybiz | 1 |
