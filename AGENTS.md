# AGENTS.md

See `CLAUDE.md` for project invariants, style, and architecture rules.

## Cursor Cloud specific instructions

### Quick reference

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Type-check | `npm run typecheck` |
| Run tests | `npm test` |
| Migrate local DB | `TURSO_DATABASE_URL="file:./local.db" npm run migrate` |
| Ingest (local) | `TURSO_DATABASE_URL="file:./local.db" RUN_LOG_DISABLED=1 npm run ingest` |
| Process (local, dry) | `TURSO_DATABASE_URL="file:./local.db" DRY_RUN=1 RUN_LOG_DISABLED=1 ANTHROPIC_API_KEY=... MODEL_TRIAGE=claude-haiku-4-5 MODEL_EXTRACTION=claude-haiku-4-5 MODEL_FACTCHECK=claude-haiku-4-5 DISCORD_WEBHOOK_NEWS=https://example.com npm run process` |

### Gotchas

- **Tests are fully offline.** All 316 tests use mocked clients; no API keys or DB needed. Just run `npm test`.
- **Local DB uses embedded SQLite** via `file:./local.db` — no Turso server needed. Run `npm run migrate` first.
- **Ingest can be slow** (~8-10 min) because it sequentially fetches 12 RSS feeds and extracts article bodies from each entry via HTTP + jsdom/Readability. Expect `Error: Could not parse CSS stylesheet` warnings from jsdom — these are benign.
- **`DRY_RUN=1`** short-circuits Discord webhook calls. Always use this for local testing to avoid posting to real channels.
- **`RUN_LOG_DISABLED=1`** prevents writing NDJSON run logs under `logs/runs/`. Use this to keep committed log files clean during dev.
- **Process/Investigate require `ANTHROPIC_API_KEY`** and model env vars. Without these, only ingest and tests can run.
- **`*.db` files are gitignored.** The local SQLite file won't be committed.
