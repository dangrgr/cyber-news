# Run summary — last 7 days

Generated at 2026-05-22T09:50:04.980Z.

## Totals

| Metric | Value |
|---|---|
| Runs | 129 |
| Runs (ingest) | 52 |
| Runs (process) | 77 |
| Articles processed | 197 |
| Articles published | 97 |
| Total cost | $1.7348 |

## Per-stage cost rollup

| Stage | Calls | Input tokens | Output tokens | Cost |
|---|---:|---:|---:|---:|
| triage | 194 | 196427 | 27983 | $0.3363 |
| extract | 216 | 402999 | 117502 | $0.9905 |
| factcheck | 111 | 220004 | 37592 | $0.4080 |
| total | 521 | 819430 | 183077 | $1.7348 |

## Failure breakdown

| Failure code | Count |
|---|---:|
| triage_not_an_incident | 35 |
| factcheck_date_out_of_window | 17 |
| triage_vendor_marketing | 16 |
| factcheck_reconcile_disagree | 14 |
| factcheck_claim_overreach | 12 |
| pattern_schema_invalid | 3 |
| factcheck_entity_not_in_article | 2 |
| triage_speculation | 1 |

## Top failing sources

| Source | Failures |
|---|---:|
| securityweek | 23 |
| bleepingcomputer | 21 |
| thehackernews | 18 |
| csoonline | 16 |
| cyberscoop | 8 |
| therecord | 6 |
| riskybiz | 4 |
| darkreading | 2 |
| krebs | 1 |
| schneier | 1 |
