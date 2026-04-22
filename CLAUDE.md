# Project context

This is a personal cybersecurity news dissector. Full design in docs/PRD.md.
Research background in docs/research-notes.md.

# Read order for any new session

1. docs/PRD.md
2. docs/research-notes.md
3. patterns/ directory (if it exists)
4. entities.yaml

# Invariants — do not change without asking

- The entity YAML is hand-maintained. Never auto-generate or auto-update it.
- Patterns produce strict JSON matching their schema.json. No freeform outputs
  from extract/triage/factcheck.
- Attribution discipline in outputs: "claims" vs "reported" vs "confirmed" are
  distinct and never flattened.
- Cost discipline: triage/extract/factcheck use Haiku-class; investigation uses
  Sonnet. Models are env-var config, not hardcoded.
- Fact-check is a publish gate. Failures go to logs, not to Discord.

# Build discipline

- One PRD phase per PR. Phase numbers in PRD §14.
- Every pattern has a fixture test in tests/patterns/{name}/ before it ships.
- Schema changes require migration files in migrations/.
- No new external dependencies without noting the free-tier status in the PR.

# Style

- TypeScript. Bun or Node 20+. Minimal dependencies.
- Errors are logged with stage_reached; we never swallow exceptions silently.
- Comments explain why, not what.
