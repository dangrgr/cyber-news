# Run summary — last 7 days

Generated at 2026-05-25T06:47:08.428Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 59 |
| Runs (process) | 71 |
| Articles processed | 193 |
| Articles published | 93 |
| Total cost | $1.7294 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 191 | 192643 | 27727 | $0.3313 |
| extract | 216 | 403310 | 119460 | $1.0006 |
| factcheck | 107 | 214056 | 36692 | $0.3975 |
| total | 514 | 810009 | 183879 | $1.7294 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 13 |
| factcheck_entity_not_in_article | 3 |
| pattern_schema_invalid | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 20 |
| thehackernews | 20 |
| bleepingcomputer | 18 |
| csoonline | 17 |
| therecord | 8 |
| cyberscoop | 7 |
| riskybiz | 5 |
| darkreading | 3 |
| krebs | 2 |
