# Cyber News Dissector - Possible Enhancements

Status: Research-backed backlog
Created: May 22, 2026
Scope: Documentation only. No implementation decisions are binding until promoted into the PRD or an issue.

---

## Executive Summary

The current project is already beyond a basic RSS-to-Discord bot. It has strict pattern schemas, chunked extraction, deterministic and LLM fact-checking, relationship-fidelity reconciliation, entity resolution, NVD caching, Discord publishing, on-demand investigations, and committed NDJSON run logs.

The most useful next improvements should not add generic "AI news app" features. They should reduce false rejects, improve source quality, cluster related coverage, capture explicit reader feedback, and make the incident archive more useful outside Discord.

The highest-leverage sequence is:

1. Improve diagnostics first: source health, date-failure analysis, extraction quality by source.
2. Improve input quality next: source-specific scraper/rewrite rules and feed-level filters.
3. Improve incident grouping: real clustering and corroboration instead of mostly per-article incident creation.
4. Add feedback loops: Discord reactions and watch rules to tune what matters.
5. Add portable outputs: curated RSS/JSON feeds and searchable archives.

Comparable tools and communities point in the same direction:

- [Miniflux rules](https://miniflux.app/docs/rules.html) emphasizes per-feed and global filtering, URL rewrite rules, content rewrite rules, and scraper CSS selectors for better full-text extraction.
- [NewsBlur Intelligence Training](https://www.newsblur.com/features/intelligence-training) lets users thumbs-up/down authors, tags, title terms, and full text, with per-feed/folder/global scopes.
- [NewsBlur Story Clustering](https://www.newsblur.com/features/story-clustering) groups duplicate stories across sources using fuzzy title matching and semantic matching.
- [NewsBlur feature set](https://www.newsblur.com/) also highlights full-text search, saved searches, daily briefings, story archive, mobile-first reading, and agent/CLI access.
- [Feedly mute filters](https://docs.feedly.com/article/251-muting-topics) and [Feedly AI threat-intel feeds](https://docs.feedly.com/article/739-ai-feeds-for-threat-intelligence) show the market direction: semantic filtering against intelligence requirements, not just keyword matching.
- [HNRSS](https://hnrss.github.io/) shows a simple but powerful model for custom feeds with keyword, points, comments, user, thread, and activity parameters.
- [Tuvix](https://tuvix.app/) emphasizes chronological, self-hostable, user-controlled feeds and exportable curated RSS from saved items.
- [FreshRSS](https://freshrss.github.io/FreshRSS/en/) reinforces baseline expectations: search/filtering, OPML import/export, mobile APIs, statistics, themes, extensions, and responsive access.
- Reddit RSS users repeatedly ask for keyword filters, source muting, custom filtered feeds, better full-text extraction, clustering similar stories, and workflows that reduce reading load rather than increase it. Relevant threads: [Missing RSS features](https://www.reddit.com/r/rss/comments/1sjr73w/missing_rss_features/), [RSS sites to pull cyber news](https://www.reddit.com/r/cybersecurity/comments/1n8jhp7/rss_sites_to_pull_cyber_news/), [NebulaPicker](https://www.reddit.com/r/selfhosted/comments/1rubmo2/nebulapicker_a_selfhosted_tool_to_generate/), [Cyberfeed](https://www.reddit.com/r/cybersecurity/comments/1r7h8sz/reintroducing_the_cyberfeed/), [Newsku](https://www.reddit.com/r/selfhosted/comments/1ppkueg/newsku_selfhosted_rss_reader_that_uses_llm_to/), and [filtering topics from RSS feeds](https://www.reddit.com/r/rss/comments/1saligh/how_to_filter_out_certain_topics_from_rss_feeds/).

The current 7-day run summary at time of review showed:

- 130 runs: 53 ingest, 77 process
- 190 articles processed
- 95 articles published
- 503 model calls
- $1.6974 total model cost
- Top failure codes: `triage_not_an_incident`, `factcheck_date_out_of_window`, `triage_vendor_marketing`, `factcheck_claim_overreach`, `factcheck_reconcile_disagree`
- Top failing sources: `securityweek`, `bleepingcomputer`, `thehackernews`, `csoonline`, `cyberscoop`

That points to a practical theme: quality work now should focus less on adding more sources and more on measuring, filtering, clustering, and preserving the right context from existing sources.

---

## Rating Rubric

| Metric | Meaning |
|---|---|
| Priority | Recommended execution order, based on expected user value and dependency shape. |
| Opportunity | The enhancement candidate. |
| Why It Matters | Primary result it should produce. |
| Effort | Estimated implementation level of effort: S, M, L, XL. |
| Impact | Expected benefit from 1 to 5. |
| Confidence | Confidence that the enhancement will pay off based on repo evidence and external research. |

---

## Scored Backlog

| Priority | Opportunity | Why It Matters | Effort | Impact | Confidence |
|---|---|---:|---:|---:|---|
| 1 | Add per-source scraper/rewrite rules | `src/ingest/fetcher.ts` silently falls back when Readability fails. Miniflux-style feed scraper rules would improve article text quality and reduce downstream false rejects. | M | 5 | High |
| 2 | Fix/tune date handling | `factcheck_date_out_of_window` is the #2 failure. Some are probably legitimate stale stories, but some look like extraction picking vulnerability discovery/publication dates. Add richer date diagnostics and maybe allow vulnerability/advisory stories a different window. | S-M | 5 | High |
| 3 | Implement real incident clustering | `src/pipeline/process.ts` still has `nearest_incident_json_or_null: "null"` and incident ID is date+victim+actor. Run logs show near-miss duplicate titles around 70-80 similarity, including same-story coverage. | M-L | 5 | High |
| 4 | Add Discord reaction feedback | NewsBlur-style training maps well here: thumbs-up/down/mute/source reactions can tune prefilter, triage, and source promotion without changing `entities.yaml`. | M | 4 | High |
| 5 | Generate custom RSS/JSON feeds from published incidents | Tuvix/NebulaPicker/FreshRSS all reinforce exportable curated feeds. A `published incidents` RSS plus filtered feeds by CVE/org/actor would make the archive usable outside Discord. | S-M | 4 | High |
| 6 | Source health and promotion dashboard | Current top failing sources include `securityweek`, `bleepingcomputer`, `thehackernews`, `csoonline`. Add per-source pass rate, cost/article, duplicate rate, and failure-code trends to summary. | S | 4 | High |
| 7 | Add saved searches / watch rules | HNRSS and Inoreader-style monitoring feeds are popular. Let `watched_orgs`, `watched_cves_proactive`, industries, and geos produce high-priority Discord labels or separate summaries. | M | 4 | Med |
| 8 | Investigation run logging parity | README notes investigate does not write per-run NDJSON. The agent is the highest-cost/highest-value path, so it should log tool calls, source fetches, caps, and final confidence like process runs. | M | 4 | High |
| 9 | Improve article archive/search UX | Cyberfeed/NewsBlur emphasize searchable/bookmarkable libraries. A tiny static published-incident index, or SQLite-backed local query script, would make the database usable without Discord/Turso CLI. | M | 3 | Med |
| 10 | Add source discovery/import workflow | Reddit users recommend finding feeds via OPML and reader search. Support OPML import/export or a candidate-source probation report for `low_trust` feeds. | M | 3 | Med |

---

## Research Notes

### Feed Quality And Filtering

Mature RSS tools treat filtering as a first-class system, not as an afterthought. Miniflux supports global and per-feed block/keep rules, date constraints, content rewrite rules, URL rewrite rules, and CSS-selector scraper rules. Feedly exposes mute filters for topics, keywords, companies, people, authors, and sites. Reddit RSS discussions repeatedly ask for keyword filters, source muting, and fast ways to dismiss recurring unwanted content.

Implication for this project: the prefilter should eventually become configurable and inspectable, not just a fixed score function in code. A personal pipeline should have a fast path for "never show this class of story again" and "always elevate this class of story."

### Full-Text Extraction

Full-text quality is foundational. If Readability extracts boilerplate, cookie banners, partial snippets, or wrong page sections, every downstream LLM stage becomes less reliable. Miniflux's scraper rules are the most directly relevant pattern: use per-host selectors and URL rewrites before falling back to generic extraction.

Implication for this project: before adding more feeds, make existing feeds better. Source-specific extraction has a better benefit-to-cost ratio than simply increasing source count.

### Story Clustering

NewsBlur's clustering model is directly applicable: group duplicate or same-event stories under one representative item while preserving alternate source cards. This project already has title fuzzy matching for dedup, but it currently drops duplicate articles before they can strengthen corroboration, and incident identity is still mostly deterministic from extraction fields.

Implication for this project: cluster coverage should be separated from dedup. Dedup answers "have I already ingested this exact article?" Clustering answers "is this another source reporting the same incident?"

### Feedback Training

NewsBlur and Feedly both train from explicit user preferences. Reddit users also value "make it use less of my attention" more than "show me more content." This maps naturally to Discord reactions because Discord is already the reading UI.

Implication for this project: feedback should change ranking, routing, and thresholds, not rewrite the hand-maintained entity YAML. Keep `entities.yaml` as curated knowledge. Store feedback separately as behavioral preference data.

### Exportable Feeds And Archives

FreshRSS, Tuvix, HNRSS, and NebulaPicker all reinforce that feeds should be portable. Users want filtered outputs they can consume in their preferred reader, not only in one UI. Cyberfeed-style projects also emphasize searchable structured data, threat-object profiles, saved collections, and dashboards.

Implication for this project: Discord is a good notification surface, but not the whole product. The incident database should have simple read paths: generated RSS, JSON, Markdown index, and local search.

---

## 1. Per-Source Scraper And Rewrite Rules

### Desired Outcome

The pipeline reliably extracts the actual article body from important sources, reducing false rejects and improving extraction quality without increasing model spend.

### User-Facing Result

More Discord posts should contain accurate summaries based on full article content, not RSS snippets or boilerplate-contaminated text. Fewer articles should fail because the model never saw the right source text.

### Current State

`src/ingest/fetcher.ts` fetches HTML, runs `jsdom` + Readability, and falls back to RSS text on failure. This is simple and reasonable, but generic extraction will fail unevenly by host. There is no source-specific rewrite, selector, or extraction quality metric.

### Inspiration

Miniflux supports URL rewrite rules and scraper rules using CSS selectors. It also supports content rewrite rules for cleaning known page patterns. This is exactly the class of feature needed here, but scoped to a small personal source list.

### Proposed Scope

- Add source-level extraction config for known hosts.
- Support URL rewrites for sites with text-only or full-page variants.
- Support CSS selector extraction for sites where Readability underperforms.
- Support removal selectors for boilerplate, related-post blocks, newsletter boxes, and cookie banners.
- Log extraction method per article: `readability`, `selector`, `rss_fallback`, `rewrite_then_readability`, `rewrite_then_selector`.
- Log extracted body length and maybe a short quality score: word count, title present, boilerplate markers present.

### Minimal Configuration Shape

Only use a config file if it keeps rules inspectable. This is an illustrative shape, not an implementation requirement:

```yaml
sources:
  bleepingcomputer:
    article_selector: "article"
    remove_selectors:
      - ".cz-news-story-title-section"
      - ".article-tips"
  example_vendor:
    rewrite_url:
      pattern: "^https://example.com/advisories/(.*)$"
      replacement: "https://example.com/advisories/$1?output=1"
```

### Acceptance Criteria

- Each configured source has fixture tests with representative HTML.
- The run log records extraction method and extracted word count.
- `rss_fallback` rate is visible by source in summaries.
- No source-specific rule can silently produce an empty body; it must fall back and log the fallback.
- No new source rule ships without a fixture showing why generic Readability was insufficient.

### Metrics

- Reduce `rss_fallback` use on high-value sources.
- Reduce source-specific `factcheck_failed` and `triage_rejected` rates caused by poor body text.
- Increase average extracted word count where current extraction is truncated.

### Risks And Concerns

- Site layouts change. Rules need periodic maintenance.
- Over-specific selectors can drop useful context.
- Paywalled or JavaScript-heavy sites may still require fallback.

### Recommended First Step

Add extraction-method logging and a source health report before adding any rules. Tune only sources with evidence of bad extraction.

---

## 2. Date Handling And Temporal Diagnostics

### Desired Outcome

The pipeline should reject genuinely stale or temporally incoherent articles, but should not reject good vulnerability/advisory articles just because the extraction selected a disclosure, exploitation, discovery, or campaign date outside the current incident window.

### User-Facing Result

Fewer useful vulnerability and campaign stories get blocked by `factcheck_date_out_of_window`. Discord posts should preserve temporal nuance: exploit observed date, vulnerability disclosure date, patch date, article publication date, and incident date should not be conflated.

### Current State

`factcheck_date_out_of_window` is a top failure. The deterministic gate checks `incident_date` against article `published_at` with a default past/future window. That is defensible for breach events, but vulnerability reporting often has multiple dates with different meanings.

### Proposed Scope

- Split extracted dates by meaning:
  - `incident_date`
  - `published_at`
  - `disclosed_at`
  - `patched_at`
  - `exploitation_observed_at`
  - `campaign_start_at`
- Keep `incident_date` for the current schema initially, but ask extract/factcheck to explain what kind of date it selected.
- Add deterministic failure detail that includes selected date, article publication date, delta days, source title, and article class.
- Add a bypass or wider window for article types where a historical date is expected, such as vulnerability advisories, retrospectives, annual reports, or campaign analyses.
- Add summary reporting for top date-failure examples so tuning is evidence-based.

### Acceptance Criteria

- Every date-window failure has enough logged context to decide whether the gate was correct.
- Vulnerability articles with old disclosure dates but new exploitation/patch context can pass when attribution is clear.
- Retrospective/report articles are not forced into "current incident" framing.
- Tests cover breach story, old vulnerability newly exploited, advisory patch story, and retrospective campaign report.

### Metrics

- Reduce false-positive `factcheck_date_out_of_window` failures.
- Keep or increase true-positive stale-story rejections.
- Measure published articles with date confidence lower than `reported`.

### Risks And Concerns

- More date fields increase schema complexity.
- If date semantics are too permissive, old stories may re-enter the feed.
- LLMs can still infer date meaning incorrectly, so deterministic diagnostics matter more than prompt wording alone.

### Recommended First Step

Add richer logging to the existing date gate before changing pass/fail behavior.

---

## 3. Real Incident Clustering

### Desired Outcome

Multiple articles covering the same event should strengthen one incident rather than produce duplicate incidents or get discarded as feed duplicates.

### User-Facing Result

Discord should show fewer duplicate-looking posts and stronger corroboration. A user should be able to open an incident and see alternate coverage from Krebs, The Record, BleepingComputer, vendor advisories, and government sources when available.

### Current State

The pipeline dedups exact URLs and high-similarity titles. Processing still passes `nearest_incident_json_or_null: "null"` into triage. Incident IDs are deterministic from date, first victim, and first actor, which is useful but brittle.

Run logs showed unique near-miss titles with high similarity, including same-story coverage around 70-80 similarity. That suggests useful corroborating articles are not always being clustered.

### Inspiration

NewsBlur clusters duplicate stories across feeds using normalized fuzzy title matching plus semantic matching. It preserves alternate sources instead of making the user read every duplicate separately.

### Proposed Scope

- Separate article dedup from incident clustering.
- Keep exact URL/title duplicate suppression for true duplicate feed entries.
- Add candidate incident matching before triage/extract:
  - title similarity
  - victim overlap
  - actor overlap
  - CVE overlap
  - source publication time proximity
  - source tier
- Pass nearest incident context into triage so it can decide "new incident" vs "corroborating coverage."
- Preserve duplicate/corroborating article URLs as incident sources instead of dropping them as noise.
- Add `cluster_confidence`: `exact`, `strong`, `weak`, `none`.

### Acceptance Criteria

- Same event from multiple sources becomes one incident with multiple source URLs.
- Different incidents involving the same actor and victim do not merge solely because names overlap.
- Cluster decisions are logged with features and scores.
- A threshold change can be evaluated against historical logs.
- Tests cover same-title duplicates, different-title same-event stories, same-victim separate events, same-CVE multi-vendor advisories, and weekly roundup articles.

### Metrics

- Increase average `corroboration_count` for published incidents.
- Reduce duplicate-looking Discord posts.
- Increase tier-1/tier-2 source diversity per incident.
- Track false merge rate manually on sampled clusters.

### Risks And Concerns

- False merges are worse than duplicate posts for analyst trust.
- Roundup articles can mention many incidents and should not merge aggressively.
- Actor/victim extraction errors can cascade into clustering errors.

### Recommended First Step

Add a read-only cluster simulation script over existing articles and incidents. Do not change pipeline behavior until sampled clusters look right.

---

## 4. Discord Reaction Feedback

### Desired Outcome

The system should learn which published items were useful, noisy, too speculative, too vendor-marketing-heavy, or worth deeper investigation, using the UI already in use: Discord.

### User-Facing Result

A quick reaction on a Discord post should affect future routing and tuning. Over time, the feed should require less manual scanning.

### Current State

Discord is a publish target, not a feedback source. `entities.yaml` is hand-maintained and should remain that way. There is no separate preference or ratings store.

### Inspiration

NewsBlur trains on thumbs-up/down signals by author, tag, title, and full text. Feedly supports mute filters for topics, sites, authors, and keywords. Reddit users frequently ask for one-click ways to suppress recurring unwanted content.

### Proposed Scope

- Poll or receive Discord reactions on published incident messages.
- Store feedback separately from `entities.yaml`, for example in a DB table or JSONL:
  - `article_id`
  - `incident_id`
  - `message_id`
  - `reaction`
  - `meaning`
  - `created_at`
- Suggested initial reaction vocabulary:
  - thumbs up: useful, show more like this
  - thumbs down: noisy or not useful
  - eyes/search: investigate
  - mute: suppress this topic/source pattern
  - bookmark/star: keep for later or include in digest
- Start with analytics only. Do not auto-tune thresholds until enough feedback exists.
- Later, apply feedback to prefilter scoring, source tier review, watch rules, and digest selection.

### Acceptance Criteria

- Feedback can be collected without posting duplicate messages or requiring a long-running bot.
- Feedback records are queryable by source, actor, CVE, org, and failure/publish outcome.
- A "feedback summary" shows what signals would have changed if automatic tuning were enabled.
- No feedback path auto-edits `entities.yaml`.

### Metrics

- Number of feedback events per week.
- Percentage of published incidents marked useful.
- Sources with high publish volume but low usefulness.
- Topics repeatedly muted or downvoted.

### Risks And Concerns

- Discord webhooks alone do not receive reactions; this may require bot token polling or a Cloudflare Worker.
- Reaction semantics can drift if too many meanings are added.
- One-user feedback can overfit quickly; use rolling windows.

### Recommended First Step

Implement a manual feedback import or polling diagnostic first. Treat feedback as observability before letting it tune behavior.

---

## 5. Custom RSS And JSON Feeds From Published Incidents

### Desired Outcome

Published, fact-checked incidents should be portable outside Discord as RSS and JSON feeds, with simple filters by actor, victim, CVE, source, confidence, and date.

### User-Facing Result

The owner can read the output in any RSS reader, archive it, pipe it to other tools, or share a curated private feed without depending on Discord as the only interface.

### Current State

Discord is the primary reading UI. Logs and Turso preserve state, but there is no feed output for published incidents.

### Inspiration

Tuvix can generate RSS feeds from saved articles. HNRSS exposes simple parameterized feeds. NebulaPicker combines and filters RSS feeds into new curated feeds. FreshRSS supports OPML and reader APIs.

### Proposed Scope

- Generate static RSS and JSON files from published incidents.
- Include at least:
  - title
  - summary
  - confidence
  - incident date
  - source URLs
  - actor/victim/CVE tags
  - Discord message link if available
  - investigation link if available
- Support separate feeds:
  - all published incidents
  - high confidence only
  - CVE-bearing incidents
  - watched orgs
  - watched CVEs
  - actor-specific or tag-specific feeds
- Keep generated feeds committed or published as workflow artifacts/pages, depending on privacy preference.

### Acceptance Criteria

- Feed validates as RSS/Atom.
- Feed items have stable IDs and do not duplicate on regeneration.
- JSON output is schema-stable and documented.
- Feed generation works offline against local SQLite for testing.
- DRY_RUN behavior does not publish externally but can still generate local output.

### Metrics

- Feed item count by category.
- Number of incidents with useful tags.
- Time from article publication to feed availability.

### Risks And Concerns

- Public GitHub Pages or public feeds could leak a personal reading graph if the repo/feed is public.
- Copyright-sensitive full text should not be republished. Feeds should include summaries and links, not article bodies.
- Parameterized dynamic feeds require hosting; static prebuilt feeds stay simpler.

### Recommended First Step

Generate a static `published-incidents.json` and `published-incidents.xml` locally or into `logs/feeds/`, then decide later whether to publish them.

---

## 6. Source Health And Promotion Dashboard

### Desired Outcome

Source quality should be measurable. Promotion/demotion between `low_trust`, `secondary`, `primary`, and aggregator treatment should be based on observed signal, failure rate, duplication, extraction quality, and cost.

### User-Facing Result

The owner can see which sources are worth keeping, which are noisy, which need scraper rules, and which deserve promotion.

### Current State

`logs/runs/summary.md` gives useful global totals and top failing sources. It does not yet provide a full per-source scorecard across ingestion, prefiltering, triage, extraction, fact-check, publish, cost, and duplicate behavior.

### Inspiration

FreshRSS includes statistics about publishing frequency. Feed/readers commonly expose feed-level health, frequency, and filtering behavior. This project already has richer logs than most personal readers, so source health is low-effort.

### Proposed Scope

Add a per-source health section to generated summaries:

- fetched
- duplicates
- pre-filtered
- passed to triage
- triage rejected
- fact-check failed
- published
- publish rate
- model cost
- average article duration
- top failure codes
- extraction fallback rate once logged
- average corroboration contribution
- suggested action: keep, tune, add scraper rule, demote, remove, promote

### Acceptance Criteria

- Source health can be generated from committed NDJSON without Turso access.
- Summary highlights the top 3 sources to investigate this week.
- Promotion/demotion recommendations are transparent and explainable.
- No recommendation auto-edits `src/ingest/sources.ts`.

### Metrics

- Publish rate by source.
- Cost per published incident by source.
- Failure-code distribution by source.
- Duplicate/corroboration contribution by source.

### Risks And Concerns

- Low publish rate is not always bad; a source may be valuable for rare high-impact stories.
- Aggregators may look noisy but still useful for early awareness.
- Small sample sizes can mislead. Include article counts and time windows.

### Recommended First Step

Extend `scripts/gen_run_summary.ts` to add a source scorecard and top tuning candidates.

---

## 7. Saved Searches And Watch Rules

### Desired Outcome

The pipeline should support explicit intelligence requirements: "tell me when this org, CVE, actor, vendor, geography, sector, or concept appears," with routing separate from generic news filtering.

### User-Facing Result

Important watched topics should be elevated or routed to separate Discord/feed outputs, even if the generic triage score would otherwise treat them as ordinary.

### Current State

`entities.yaml` has `watched_orgs` and `watched_cves_proactive`, but watch behavior is limited. Prefilter scoring includes entity aliases and CVEs, but there is not a richer saved-search concept.

### Inspiration

HNRSS supports query feeds and activity filters. Feedly AI threat-intel feeds are built around intelligence requirements and semantic cyber models. Inoreader-style active searches and Reddit RSS search feeds are a popular pattern.

### Proposed Scope

- Define watch rules outside hand-maintained entity canonicalization, or extend the watched sections carefully.
- Support rule types:
  - exact keyword
  - entity alias
  - CVE
  - vendor/product
  - sector
  - geography
  - semantic concept
- Support rule actions:
  - boost prefilter score
  - never suppress
  - add Discord label
  - route to a separate feed/channel
  - include in daily digest
  - trigger investigation candidate
- Log every watch-rule hit and action.

### Acceptance Criteria

- A watched rule hit is visible in the Discord embed or feed item.
- Rule matching is explainable in logs.
- False positives can be muted without removing the underlying source.
- Tests cover exact match, alias match, CVE match, negative match, and source-scoped match.

### Metrics

- Watch-rule hits per week.
- Publish rate of watch-rule hits.
- Feedback score for watched hits versus generic hits.
- False-positive rate by rule.

### Risks And Concerns

- Semantic watch rules add model cost if evaluated on every article.
- Keyword watch rules can be noisy.
- Too many high-priority rules recreate the firehose.

### Recommended First Step

Start with exact/CVE/entity watch rules only. Add semantic rules after feedback data exists.

---

## 8. Investigation Run Logging Parity

### Desired Outcome

Investigations should be as inspectable as ingest and process runs. Tool calls, fetched sources, phase transitions, budget caps, errors, final confidence, and output metadata should be queryable from committed logs.

### User-Facing Result

When an investigation looks weak, incomplete, expensive, or wrong, the owner can inspect exactly what happened without reading raw workflow logs or guessing from the final Markdown.

### Current State

The README notes that investigate commits investigation Markdown but does not write per-run NDJSON in the same way ingest/process do. The orchestrator tracks cost, tool calls, termination reason, and errors internally, but parity with run logs would improve debugging.

### Inspiration

The project's own observability design already establishes the right pattern for ingest/process. PAI-style named phases and Ideal State Criteria are already in the investigation prompt. The missing piece is structured telemetry around that behavior.

### Proposed Scope

- Wrap `npm run investigate` with `startRun("investigate")`.
- Log:
  - investigation start
  - incident ID and source-zero metadata
  - model call usage/cost
  - tool call name, input digest, duration, success/error
  - fetched URL metadata: host, status, allowlist result, truncation, inferred published date if available
  - phase transition markers if parseable
  - termination reason
  - final confidence and sources fetched
  - Discord payload metadata
- Add MCP run-log tool support for investigation traces.

### Acceptance Criteria

- A failed or partial investigation has a structured trace.
- Cost and tool-call caps are visible in weekly summaries.
- Source fetch failures can be aggregated by host and error type.
- No secret-bearing tool input or raw API key is logged.

### Metrics

- Average investigation cost.
- Average tool calls per investigation.
- Termination reason distribution.
- Sources fetched by tier.
- Failed allowlist attempts.

### Risks And Concerns

- Investigation logs may contain sensitive source text or personal research trails.
- Tool inputs need redaction/digesting where appropriate.
- Logs can grow faster than process logs.

### Recommended First Step

Log summary-level investigation events first. Add full tool-level traces only after redaction rules are clear.

---

## 9. Article Archive And Search UX

### Desired Outcome

The incident archive should be easy to browse, search, and use for follow-up analysis without needing Discord search, Turso CLI access, or ad hoc SQL.

### User-Facing Result

The owner can answer questions like "what did I publish about ShinyHunters last month?", "which CVEs appeared this week?", "show all claim-confidence incidents," or "what was investigated but still unresolved?"

### Current State

Turso stores structured incidents. Logs store run telemetry. Discord receives embeds. There is no dedicated archive UI or static index optimized for reading and search.

### Inspiration

Cyberfeed highlights searchable/filterable feeds, bookmarks, custom collections, threat object profiles, and dashboards. NewsBlur emphasizes full-text search, saved stories, tags, and archives. FreshRSS provides filtering and mobile APIs.

### Proposed Scope

Start small:

- Generate a static Markdown or JSON index of published incidents.
- Add local query commands over Turso or committed JSON.
- Support filters:
  - actor
  - victim
  - CVE
  - confidence
  - date range
  - source
  - investigated/not investigated
  - campaign tag
- Later, add a lightweight static HTML dashboard if Markdown/JSON is not enough.

### Acceptance Criteria

- Archive generation is deterministic.
- Search results include incident ID, title, date, confidence, summary, source URLs, Discord message ID, and investigation status.
- The archive can be regenerated locally against `file:./local.db`.
- It does not republish full article bodies.

### Metrics

- Number of incidents searchable by actor/CVE/org.
- Number of incidents with investigation reports linked.
- Query latency for local archive script.

### Risks And Concerns

- Building a UI too early can distract from pipeline quality.
- Public static output can expose personal preferences or reading history.
- Search quality depends on consistent extraction and tags.

### Recommended First Step

Add a generated `logs/incidents/index.md` or `logs/incidents/index.json` before considering a web UI.

---

## 10. Source Discovery And OPML Import Workflow

### Desired Outcome

Adding sources should be deliberate, measurable, reversible, and compatible with existing RSS ecosystems.

### User-Facing Result

The owner can import candidate feeds, run them in `low_trust` probation, and promote only sources that prove useful. The current feed list can also be exported for backup or reuse.

### Current State

Sources are hardcoded in `src/ingest/sources.ts`. `low_trust` exists as an onboarding tier, but there is no discovery/import/export workflow or probation report.

### Inspiration

FreshRSS and most serious RSS tools support OPML import/export. Tuvix promotes feed-list sharing. Reddit users commonly recommend using existing readers or OPML lists to discover source feeds. Feed discovery is useful, but uncontrolled source growth is a noise risk.

### Proposed Scope

- Export configured sources to OPML.
- Import OPML into a candidate list, not directly into active sources.
- Support source probation:
  - default tier: `low_trust`
  - stricter prefilter threshold
  - no direct Discord publishing unless corroborated by trusted source
  - weekly health report
- Add candidate-source metadata:
  - feed URL
  - homepage
  - proposed tier
  - reason for adding
  - date added
  - observed publish rate
  - observed pass/publish/failure rates
- Promote/demote manually after review.

### Acceptance Criteria

- OPML export validates and can be imported by common readers.
- OPML import never auto-enables new sources without review.
- Low-trust probation sources are scored separately.
- A promotion report recommends keep/promote/remove with supporting metrics.

### Metrics

- Candidate source publish rate.
- Candidate source failure rate.
- Candidate source unique-story contribution.
- Candidate source corroboration contribution.

### Risks And Concerns

- More sources can increase costs and noise faster than they increase insight.
- OPML feeds from broad readers may be off-topic.
- Source reputation is context-dependent; avoid automatic promotion.

### Recommended First Step

Add OPML export first. Import/probation can follow once source health scoring exists.

---

## Cross-Cutting Ideas

### Keep The Pipeline Results-Oriented

Every enhancement should answer one of these questions:

- Does this reduce bad posts?
- Does this reduce missed important posts?
- Does this reduce repeated reading?
- Does this improve attribution accuracy?
- Does this make debugging easier?
- Does this preserve useful knowledge for later?

If an enhancement does not clearly improve one of those outcomes, it should stay out of scope.

### Prefer Diagnostics Before Automation

Several items can be shipped safely as observability before behavior changes:

- Date-failure diagnostics before date-gate tuning
- Cluster simulation before automatic incident merging
- Feedback collection before automatic threshold tuning
- Source health report before source promotion/demotion
- Extraction-method logging before source-specific scraper rules

This lowers regression risk and gives a before/after baseline.

### Preserve Existing Invariants

These enhancements should not weaken current project discipline:

- Keep `entities.yaml` hand-maintained.
- Keep fact-check as a publish gate.
- Keep attribution language strict.
- Keep models env-configured.
- Keep tests offline.
- Keep Discord dry-run safe.
- Keep schema changes in migrations.

---

## Suggested Implementation Order

### Phase A: Measurement

1. Source health dashboard.
2. Extraction-method logging.
3. Date-failure diagnostics.
4. Cluster simulation report.

### Phase B: Quality

1. Per-source scraper/rewrite rules for worst offenders.
2. Date handling split for vulnerabilities/advisories.
3. Incident clustering with conservative thresholds.

### Phase C: Personalization

1. Discord reaction feedback as analytics.
2. Watch rules and saved searches.
3. Feedback-informed source and prefilter tuning.

### Phase D: Portability

1. Static JSON/RSS feeds.
2. Archive/search index.
3. OPML export/import and low-trust source probation.

---

## Questions

- Should Discord remain the primary UI, or should generated RSS/JSON become equally important?
- Is source quality more important than source breadth for the next month? The current evidence says yes.
- Should `low_trust` sources ever publish directly, or only corroborate trusted-source incidents?
- What is the right false-merge tolerance for clustering? For analyst trust, it should probably be very low.
- Should feedback be allowed to tune thresholds automatically, or should it only generate recommendations?
- Should generated feeds be private artifacts, committed files, or published somewhere like GitHub Pages?

## Comments

- The repo already has the right bones. The next gains are operational, not architectural.
- The strongest external pattern is "make the user read less." Avoid features that create more surfaces to monitor without reducing noise.
- Per-source full-text quality is likely under-measured right now. It should be made visible before adding feeds.
- Date handling deserves focused attention because it is both common and subtle. A single `incident_date` field is probably too compressed for vulnerability reporting.

## Ideas

- Add "why posted" and "why rejected" explainers to summaries, using existing run-log fields.
- Add a weekly "what changed in the threat landscape" synthesis once clustering and source health are stable.
- Add "alternate source cards" to Discord embeds when clustering finds multiple sources.
- Add a "candidate investigations" digest: high-impact, low-confidence, high-corroboration incidents.
- Add "source probation weeks" where new feeds are ingested and scored but never posted.

## Concerns

- Clustering can damage trust if it merges unrelated incidents. Simulate first.
- Feedback can overfit because there is one user. Use rolling windows and recommendations before automation.
- More feeds will likely increase cost and noise unless source health and filtering improve first.
- Static archives and generated feeds may expose private reading interests if published publicly.
- Scraper rules require maintenance. Add only rules backed by measurable failures.
