# Run summary — last 7 days

Generated at 2026-05-29T12:28:52.999Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 65 |
| Runs (process) | 59 |
| Articles processed | 126 |
| Articles published | 67 |
| Total cost | $1.2283 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 126 | 127098 | 18170 | $0.2179 |
| extract | 153 | 290541 | 86921 | $0.7251 |
| factcheck | 71 | 151582 | 26721 | $0.2852 |
| total | 350 | 569221 | 131812 | $1.2283 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_vendor_marketing | 19 |
| triage_not_an_incident | 15 |
| factcheck_date_out_of_window | 14 |
| factcheck_claim_overreach | 4 |
| factcheck_reconcile_disagree | 4 |
| factcheck_entity_not_in_article | 3 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 16 |
| csoonline | 12 |
| thehackernews | 11 |
| bleepingcomputer | 10 |
| darkreading | 3 |
| therecord | 3 |
| cyberscoop | 2 |
| krebs | 1 |
| riskybiz | 1 |
