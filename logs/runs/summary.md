# Run summary — last 7 days

Generated at 2026-05-21T23:16:51.095Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 130 |
| Runs (ingest) | 52 |
| Runs (process) | 78 |
| Articles processed | 191 |
| Articles published | 95 |
| Total cost | $1.7034 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 188 | 190693 | 27172 | $0.3266 |
| extract | 210 | 404099 | 115132 | $0.9798 |
| factcheck | 107 | 216101 | 36190 | $0.3971 |
| total | 505 | 810893 | 178494 | $1.7034 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 33 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 15 |
| factcheck_claim_overreach | 13 |
| factcheck_reconcile_disagree | 12 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 22 |
| securityweek | 22 |
| thehackernews | 17 |
| csoonline | 15 |
| cyberscoop | 8 |
| therecord | 5 |
| riskybiz | 3 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
