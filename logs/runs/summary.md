# Run summary — last 7 days

Generated at 2026-05-27T12:52:31.382Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 124 |
| Runs (ingest) | 63 |
| Runs (process) | 61 |
| Articles processed | 146 |
| Articles published | 73 |
| Total cost | $1.3144 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 146 | 147322 | 20772 | $0.2512 |
| extract | 169 | 300069 | 92264 | $0.7614 |
| factcheck | 80 | 155322 | 29307 | $0.3019 |
| total | 395 | 602713 | 142343 | $1.3144 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 23 |
| triage_vendor_marketing | 19 |
| factcheck_date_out_of_window | 14 |
| factcheck_reconcile_disagree | 7 |
| factcheck_claim_overreach | 6 |
| factcheck_entity_not_in_article | 3 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 19 |
| thehackernews | 17 |
| csoonline | 11 |
| bleepingcomputer | 10 |
| therecord | 6 |
| cyberscoop | 4 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
