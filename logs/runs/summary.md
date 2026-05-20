# Run summary — last 7 days

Generated at 2026-05-20T19:36:03.022Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 133 |
| Runs (ingest) | 55 |
| Runs (process) | 78 |
| Articles processed | 190 |
| Articles published | 98 |
| Total cost | $1.7522 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 187 | 189738 | 27166 | $0.3256 |
| extract | 215 | 414887 | 117882 | $1.0043 |
| factcheck | 112 | 232020 | 38056 | $0.4223 |
| total | 514 | 836645 | 183104 | $1.7522 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 30 |
| factcheck_date_out_of_window | 16 |
| factcheck_claim_overreach | 14 |
| factcheck_reconcile_disagree | 14 |
| triage_vendor_marketing | 13 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |

## Top failing sources

| Source | Failures |
|---|---:|
| bleepingcomputer | 24 |
| securityweek | 20 |
| csoonline | 15 |
| thehackernews | 15 |
| cyberscoop | 9 |
| therecord | 3 |
| darkreading | 2 |
| riskybiz | 2 |
| krebs | 1 |
| schneier | 1 |
