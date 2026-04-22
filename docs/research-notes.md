# Cyber News Dissector — Reading Notes

Deep research pass on the four sources from the design discussion. Goal: extract what's genuinely useful for our design, separate the signal from the hype, and translate findings into concrete PRD decisions.

Sources:

1. **Fabric** by Daniel Miessler — github.com/danielmiessler/Fabric
2. **PAI (Personal AI Infrastructure)** by Daniel Miessler — danielmiessler.com/blog/personal-ai-infrastructure (April 2026 rev)
3. **"Uncovering Vulnerabilities of LLM-Assisted Cyber Threat Intelligence"** — arxiv 2509.23573 (v3, Feb 2026)
4. **"Using LLMs to Automate Threat Intelligence Analysis Workflows in SOCs"** — arxiv 2407.13093 (Tseng et al, 2024)

---

## 1. Fabric — the Pattern primitive

Fabric is Miessler's open-source framework for "augmenting humans using AI." ~200 crowdsourced prompt patterns, ~300 contributors, MIT-licensed. The core abstraction:

**A Pattern is a single-purpose prompt with a defined input/output contract.** You pipe content in, Fabric runs the pattern, structured output comes out. `cat article.txt | fabric -p analyze_threat_report`. That's it. No framework, no agents, no orchestration. Just a prompt library with a CLI runner.

The patterns directly relevant to our project:

- `analyze_threat_report` — extracts TRENDS / STATISTICS / QUOTES / REFERENCES / RECOMMENDATIONS from reports like DBIR, CrowdStrike Global Threat Report
- `analyze_threat_report_trends` — up to 50 trends from a single report
- `analyze_threat_report_cmds` — actionable commands for pentesters
- `create_security_update` — concise newsletter-format security updates
- `create_sigma_rules` — TTP extraction + Sigma rule generation
- `extract_wisdom` — the workhorse pattern, general info extraction

**What's genuinely useful:**

The Pattern as a primitive. It's the right abstraction for our pipeline. Everything in the current PRD's §10 — triage, extract, fact-check, investigate, synthesize — is already Pattern-shaped. Naming them as Patterns and filing them under `patterns/` gives:

- Each prompt becomes independently testable (input fixture → expected JSON output)
- Prompts are swappable without pipeline changes — swap a bad extractor for a better one by changing one file
- Potential future contribution back to Fabric as `analyze_cyber_news_article`

**What's not directly useful:**

Fabric's patterns are designed for human-triggered one-shot use (`cat foo | fabric -p bar`), not programmatic pipeline use with strict JSON schemas. Our patterns need stricter output contracts than Fabric's, because downstream code consumes them. Treat Fabric as architectural inspiration, not a library dependency.

Also, Fabric's `analyze_threat_report` output schema (TRENDS / STATISTICS / QUOTES / REFERENCES / RECOMMENDATIONS) is tuned for annual reports, not news articles. Use it as a reference for the **synthesis** stage (the weekly Ringmast4r-style output), not the extract stage.

**Concrete PRD change:**

Reorganize §10 prompts into a `patterns/` directory. Each pattern gets `pattern.md` (system prompt) + `schema.json` (strict output shape). Pipeline code references patterns by name. Future-proof path toward publishing `analyze_cyber_news_article` as a Fabric contribution if we ever want to.

---

## 2. PAI — the architectural vocabulary

PAI is Miessler's full personal AI system. Much larger in scope than what we're building (67 Skills, 333 workflows, 17 hooks, 3,540+ learning signals), but several of its architectural ideas translate.

**The seven-component model:** Intelligence / Context / Personality / Tools / Security / Orchestration / Interface. Useful framing but larger than we need. We're not building an assistant, we're building a news pipeline with an investigation mode. Four of the seven apply to us: Intelligence (the prompts/models), Context (entity YAML + incident DB), Tools (RSS, Brave, NVD, Playwright), Orchestration (GH Actions + Routines).

**The Algorithm — OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN.** This is the piece worth stealing. PAI runs it on every substantive request. Two things make it useful:

1. **Ideal State Criteria (ISC).** Every task decomposes into binary, testable success criteria *before* execution. "3–5 corroborating sources fetched." "Every CVE in the draft validates against NVD." "No claim marker in article flattened to 'confirmed' in summary." These are the VERIFY phase's checklist. The investigation agent currently has a freeform "research discipline" list — turning those into explicit ISC items that the agent must check off before finishing is a quality upgrade at near-zero cost.

2. **Named, traceable phases.** When an investigation fails or produces something weird, being able to ask "what happened in VERIFY?" and pull the specific transcript section is much more diagnostic than scrolling a monolithic agent trace.

PAI uses seven phases. For our investigation, five are enough: **OBSERVE → PLAN → FETCH → VERIFY → SYNTHESIZE**. Mapping:

- OBSERVE: read source-zero fully, extract the specific claims that need corroboration, define ISC
- PLAN: decide which of (Brave / victim statement / vendor advisory / government advisory / CVE lookup / historical incidents) to hit, in what order
- FETCH: call tools, gather evidence bundle
- VERIFY: check each ISC item explicitly. Are 3–5 corroborating sources in hand? Does every factual claim in the draft have a source bracket? Are claim markers preserved from the originals?
- SYNTHESIZE: write the markdown report

**The three-tier memory model:** Session / Work / Learning. This maps cleanly onto what we already have but haven't named:

- *Session* = one investigation's context (currently implicit in the Routine's session)
- *Work* = actively tracked campaigns + incidents under investigation (currently the `incidents` table)
- *Learning* = the entity YAML + your thumbs-up/down on posted summaries (currently just the entity YAML)

V2 upgrade: capture explicit ratings on posted summaries via Discord reactions (👍 / 👎). Persist to `ratings.jsonl`. Over time, adjust the pre-filter threshold and triage prompt based on what you consistently up/down-vote. This is PAI's SIGNALS system adapted to our scale — a much simpler version of it, but the same idea.

**The Hook System:** 17 hooks across 7 lifecycle events. Too heavyweight for our scope, but the primitive is worth borrowing. Our pipeline already has hook-shaped operations — pre-triage dedup, post-extract entity resolution, pre-publish fact-check. Naming them as hooks in the code structure (`hooks/pre_publish_fact_check.ts`) makes them individually testable and orderable. No change to behavior, just naming.

**What's explicitly not useful for us:**

- The **Personality** component. 12 quantified traits, ElevenLabs voices per agent. Miessler's use case is a lifestyle companion; ours is a reader. Zero.
- **The full PAI repo as a dependency.** It's a lifestyle integration for one person. Take the architecture, leave the code.
- **The parallel agent swarm pattern** ("research these 5 companies in parallel"). We don't have 5 investigations that need to run simultaneously. One at a time is fine.

**Concrete PRD changes:**

1. Add ISC to the investigation Routine. `VERIFY` phase must produce a checklist with pass/fail on each criterion before `SYNTHESIZE` runs.
2. Name the investigation phases explicitly (§10.4 prompt update).
3. Note `ratings.jsonl` + Discord reactions as a v2 learning feedback loop.
4. Rename pipeline stages in code to match hook-style naming.

---

## 3. arxiv 2509.23573 — the LLM-CTI failure modes paper

Submitted Sep 2025, latest revision Feb 2026. Title is accurate: it's an empirical study of where LLMs fail at CTI tasks specifically. The authors argue the dominant failure mode in CTI isn't generic hallucination — it's three domain-specific cognitive failures driven by the nature of threat intelligence data itself.

This is the paper that matters most for our project. Read it before tuning prompts, because they've catalogued the exact failure modes our extraction and investigation agents will hit.

**The taxonomy — three failure classes, four CTI stages.**

Failure classes:

1. **Spurious correlations from superficial metadata**
2. **Contradictory knowledge from conflicting sources**
3. **Constrained generalization to emerging threats**

These surface across four CTI stages: Contextualization, Attribution, Prediction, Mitigation. For our pipeline, the two that matter are Contextualization (the extract stage) and Attribution (the investigation stage).

**Class 1: Spurious correlations (the extractor's failure mode)**

Five subtypes they identify:

- **1.1 Co-mention bias from raw threat incidents.** If two entities appear near each other in reporting, the LLM infers a relationship that isn't there. Example: an article mentions Stryker and Lockheed in consecutive paragraphs because both are in the same week's news — a naive extractor links them as "related incidents." They are not.
- **1.2 Exploitation bias from deliberately reused IoCs.** Attackers intentionally reuse infrastructure of unrelated actors as false flags. LLMs take the reuse at face value and over-attribute.
- **1.3 Confounding factors.** Two entities correlate with a common third cause, LLM infers direct relation.
- **1.4 Skewed source.** LLM relies heavily on the most-quoted sources regardless of quality. Aggregators rank higher than they should.
- **1.5 Hierarchical metadata from attack chains.** LLMs over-weight position in an attack chain (initial access / execution / etc.) even when the article doesn't support the mapping.

**What this means for our extractor:**

The entity-in-article check we already have catches some of this (an actor not literally named in the article can't be extracted). It doesn't catch co-mention bias — both entities ARE in the article, just not related. The fix is in the schema: extraction must distinguish `victim_orgs_confirmed` (attested as victim) from `orgs_mentioned` (referenced for context). Same for actors.

Also: the fact-check pattern needs a new check — **relationship fidelity**. For every `(actor, victim)` pair in the extraction, the fact-check must find a sentence in the source that explicitly links them. "ShinyHunters hit Cisco" qualifies. "Cisco was breached. Separately, ShinyHunters was active this quarter." does not.

**Class 2: Contradictory knowledge (the investigation agent's failure mode)**

Five subtypes:

- **2.1 Temporal contradiction between outdated and recent evidence.** Older reports and newer retractions both exist in training data and in live search results. LLM picks wrong one.
- **2.2 Conflicting reports of attack contexts or dependencies.** Different sources describe different parts of an attack chain; LLM picks one as definitive.
- **2.3 Semantic conflict.** Same entity name, different referents (Cisco the company vs. Cisco Talos the research arm).
- **2.4 Divergent data structure across platforms.** MITRE's ATT&CK, MISP galaxies, and vendor PSIRTs disagree on actor groupings.
- **2.5 Misaligned knowledge and security standards.** Claim-vs-confirmed conventions vary wildly across publications.

**What this means for our investigation agent:**

2.1 and 2.4 are the big ones. The Oracle 2025/2026 example from the Ringmast4r piece is a pure 2.1 failure — a reader corrected the dates because sources published during the tail of the event were all dated 2025–2026 and the agent had no temporal anchor.

Concrete fixes for the investigation Routine:

- **Always record `fetched_at` and the source's `published_at` on every piece of evidence.** The evidence bundle already has `fetched_at`; add `source_published_at`.
- **In the VERIFY phase, explicitly check temporal consistency.** If evidence sources span more than 12 months, flag it. If the incident is described as "recent" but the earliest authoritative source is >6 months old, flag it.
- **Prefer newer sources over older ones for "current status" claims.** For attribution claims, prefer the most recent authoritative source; for initial discovery claims, prefer the earliest.
- **On alias resolution, cross-check across MITRE + entity YAML + MISP.** When they disagree (2.4), note the disagreement in the output rather than picking one silently.

**Class 3: Constrained generalization (the whole pipeline's failure mode)**

- **3.1 Distributional bias.** LLM under-represents emerging / rare actor categories because training data is skewed.
- **3.2 Unseen pattern from emerging threats.** New TTPs confuse the model.
- **3.3 Overfitted reasoning.** LLM pattern-matches against familiar scenarios and misses nuance.
- **3.4 Environmental unawareness.** LLM doesn't know current geopolitical context.

**What this means for us:**

Less fixable in prompts, more fixable in the entity YAML. The YAML is our defense against 3.1 and 3.4 — by explicitly listing actors (including the obscure ones) and current campaigns, we inject the environmental context the model is missing. Emphasizes that the weekly YAML maintenance is the core quality lever.

**Key defensive pattern from the paper:**

Their validation approach is **causal interventions** — perturb the input to see if the model's answer changes for the right reasons. A targeted version worth stealing: for the extract stage, on high-signal incidents, run extraction twice with one minor perturbation (e.g., swap paragraph order). If the extraction is stable, confidence goes up. If it flips, the original extraction was pattern-matched on something fragile.

Too expensive to do on every article. Right size for occasional QA runs on a sample of published incidents.

**Concrete PRD changes:**

1. Extraction schema: split `victim_orgs` into `victim_orgs_confirmed` and `orgs_mentioned`. Same for actors.
2. Fact-check pattern: add a relationship-fidelity check.
3. Evidence bundle: add `source_published_at` alongside `fetched_at`.
4. Investigation VERIFY phase: explicit temporal-consistency check.
5. Add a short "known LLM-CTI failure modes" section to the PRD's operational notes, referencing this paper for maintainers.

---

## 4. arxiv 2407.13093 — the voting + RAG purification paper

Tseng et al (Penn State + NIST + Worcester Poly + Northern Arizona). Focus is narrower than the 2509 paper: automating IOC extraction and SIEM rule (Sigma-style) generation from CTI reports. The CTI reports they work on are not exactly our news articles, but the purification pattern is directly transferable.

**Their core technique (for the purposes of our project):**

1. **Chunk the input.** Instead of feeding the whole report to the LLM, feed it paragraph-by-paragraph. Reduces context burden, reduces hallucination.
2. **Run extraction multiple times per chunk (voting).** Their paper runs 2–3 passes per paragraph. Keep only entities that appear in the majority of runs.
3. **RAG-purify the consensus entities.** Check each against a reference corpus (their case: MITRE ATT&CK evaluation dataset).
4. **Iterative regex validation for IOC patterns.** Not relevant to us.

They report **90% IOC detection and 99% regex matching accuracy** with this pipeline. The ScienceDirect voting-agreement paper independently validates voting as a methodology for CTI extraction across model-disagreement cases.

**What's directly useful for our project:**

- **Paragraph-level extraction.** Our current extract prompt feeds the full article body to the LLM. For articles >1500 words, we should chunk and extract per-chunk, then merge. Cheap quality win.
- **Voting on high-stakes extractions.** Running the extractor twice on everything is ~2× the extraction cost ($2.50/mo → $5/mo). Not worth it for everything, definitely worth it for *publication-gated* extractions. Change: run extract once, fact-check, and if fact-check returns any OVERREACH verdicts, run extract a second time and compare. If the second run disagrees on the OVERREACH fields, escalate confidence to `claim`. If it agrees, hold.
- **RAG purification via entity YAML.** Our entity YAML is already a reference corpus. After extraction, RAG-resolve actors: for each extracted actor name, find canonical form in YAML, or flag as unknown. We already do this lightly in §8.5; make it explicit as a purification step.

**What's not useful:**

- The IOC/SIEM output format. Our output is narrative incidents, not detection rules.
- Their ~5000-line Python agent. Overbuilt for our needs.

**Concrete PRD changes:**

1. Extract stage: chunk articles >1500 words to paragraph-level, extract per-chunk, merge.
2. Fact-check stage: on OVERREACH verdicts, re-run extract once and reconcile.
3. Entity resolution: make RAG-purification against entity YAML an explicit stage between extract and fact-check.

---

## Honest calibration on the research

None of these sources are perfectly tuned to our problem. Fabric is a prompt library not a pipeline. PAI is a lifestyle system, not a news dissector. The 2509 paper is about LLM evaluation, not system design. The 2407 paper is about IOC extraction, not news narrative extraction.

But they each answer one specific question well:

- **Fabric** → What's the right unit of modularity? Answer: the Pattern.
- **PAI** → What's the right architectural vocabulary? Answer: OBSERVE → PLAN → FETCH → VERIFY → SYNTHESIZE with ISC, plus three-tier memory.
- **2509** → What fails? Answer: three cognitive classes × four CTI stages; we need relationship-fidelity checks and temporal consistency checks we don't currently have.
- **2407** → How do we make extraction more reliable? Answer: chunk + vote + RAG-purify. Chunking is free, voting is selective.

**Things I'd read next, if we want to go deeper:**

- **LLMCloudHunter** (arxiv 2407.05194) — takes the voting pattern further and reports 99% precision / 98% recall on IoC extraction with a multi-stage LLM pipeline. If we ever add Sigma rule output, this is the reference.
- **"AURA: Multi-Agent Intelligence Framework for Knowledge-Enhanced Cyber Threat Attribution"** — relevant if we ever need a more serious attribution agent.
- **Miessler's "Personal AI Maturity Model"** post — a framework for thinking about where on the assistant-capability ladder we want our system to sit.

---

## Summary of PRD updates coming from this research

1. Reorganize §10 prompts into `patterns/` directory (from Fabric).
2. Name the investigation phases OBSERVE → PLAN → FETCH → VERIFY → SYNTHESIZE (from PAI).
3. Add ISC to the investigation VERIFY phase (from PAI).
4. Split extraction schema: `victim_orgs_confirmed` vs `orgs_mentioned` (from 2509).
5. Add relationship-fidelity check to fact-check pattern (from 2509).
6. Add `source_published_at` to evidence bundle + explicit temporal-consistency check in VERIFY (from 2509).
7. Chunk articles >1500 words during extraction (from 2407).
8. On fact-check OVERREACH, re-run extract and reconcile (from 2407).
9. Add reading list section referencing all four sources (for maintainers / future-me).
10. Note Discord-reactions → `ratings.jsonl` as v2 learning feedback (from PAI).

All ten are narrow, well-scoped changes. None of them require rearchitecture. The most architecturally substantive change is #1 (patterns directory), and that's more about file layout than behavior.
