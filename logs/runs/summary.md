# Run summary — last 7 days

Generated at 2026-05-22T17:29:11.561Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 128 |
| Runs (ingest) | 52 |
| Runs (process) | 76 |
| Articles processed | 191 |
| Articles published | 92 |
| Total cost | $1.6868 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 189 | 191036 | 27401 | $0.3280 |
| extract | 211 | 389589 | 115354 | $0.9664 |
| factcheck | 105 | 207642 | 36954 | $0.3924 |
| total | 505 | 788267 | 179709 | $1.6868 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 36 |
| factcheck_date_out_of_window | 16 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 14 |
| factcheck_reconcile_disagree | 13 |
| factcheck_entity_not_in_article | 2 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 21 |
| bleepingcomputer | 20 |
| thehackernews | 18 |
| csoonline | 17 |
| cyberscoop | 8 |
| therecord | 7 |
| riskybiz | 4 |
| darkreading | 3 |
| krebs | 1 |
