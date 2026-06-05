import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = path.resolve(import.meta.dirname, '../..');

test('local_run.sh exports sourced env-file variables to npm children', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'cyber-news-local-run-'));
  const appHome = path.join(tmp, 'app');
  const binDir = path.join(tmp, 'bin');
  const envFile = path.join(tmp, 'cyber-news.env');
  const observed = path.join(tmp, 'observed-env.jsonl');

  mkdirSync(binDir, { recursive: true });
  writeFileSync(envFile, [
    `OBSERVED_ENV_OUT=${observed}`,
    'MODEL_TRIAGE=env-file-triage-model',
    'MODEL_EXTRACTION=env-file-extraction-model',
    'MODEL_FACTCHECK=env-file-factcheck-model',
    'LLM_AUTH_MODE=api_key',
    '',
  ].join('\n'));

  const npmStub = path.join(binDir, 'npm');
  writeFileSync(npmStub, `#!/usr/bin/env bash
set -euo pipefail
node -e 'const fs=require("fs"); fs.appendFileSync(process.env.OBSERVED_ENV_OUT, JSON.stringify({cmd: process.argv.slice(1), MODEL_TRIAGE: process.env.MODEL_TRIAGE || null, MODEL_EXTRACTION: process.env.MODEL_EXTRACTION || null, MODEL_FACTCHECK: process.env.MODEL_FACTCHECK || null}) + "\\n")' "$@"
`);
  chmodSync(npmStub, 0o755);

  const result = spawnSync('bash', ['scripts/local_run.sh', 'process'], {
    cwd: repoRoot,
    env: {
      PATH: `${binDir}:${process.env.PATH}`,
      CYBER_NEWS_APP_HOME: appHome,
      CYBER_NEWS_ENV_FILE: envFile,
      CYBER_NEWS_REPO: repoRoot,
      // Ensure the test only passes if local_run.sh exports values from envFile.
      MODEL_TRIAGE: '',
      MODEL_EXTRACTION: '',
      MODEL_FACTCHECK: '',
      LLM_AUTH_MODE: '',
    },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const rows = readFileSync(observed, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.MODEL_TRIAGE, 'env-file-triage-model');
    assert.equal(row.MODEL_EXTRACTION, 'env-file-extraction-model');
    assert.equal(row.MODEL_FACTCHECK, 'env-file-factcheck-model');
  }
});

test('local_run.sh refreshes expired Claude Code OAuth before process runtime', () => {
  const tmp = mkdtempSync(path.join(tmpdir(), 'cyber-news-local-run-oauth-'));
  const appHome = path.join(tmp, 'app');
  const binDir = path.join(tmp, 'bin');
  const configDir = path.join(tmp, 'claude');
  const envFile = path.join(tmp, 'cyber-news.env');
  const observed = path.join(tmp, 'observed-env.jsonl');
  const refreshOut = path.join(tmp, 'claude-refresh.txt');

  mkdirSync(binDir, { recursive: true });
  mkdirSync(configDir, { recursive: true });
  writeFileSync(
    path.join(configDir, '.credentials.json'),
    JSON.stringify({ claudeAiOauth: { accessToken: 'expired-access', expiresAt: 1 } }),
  );
  writeFileSync(envFile, [
    `OBSERVED_ENV_OUT=${observed}`,
    `CLAUDE_REFRESH_OUT=${refreshOut}`,
    `CLAUDE_CONFIG_DIR=${configDir}`,
    'MODEL_TRIAGE=env-file-triage-model',
    'MODEL_EXTRACTION=env-file-extraction-model',
    'MODEL_FACTCHECK=env-file-factcheck-model',
    'LLM_AUTH_MODE=oauth',
    '',
  ].join('\n'));

  const npmStub = path.join(binDir, 'npm');
  writeFileSync(npmStub, `#!/usr/bin/env bash
set -euo pipefail
node -e 'const fs=require("fs"); fs.appendFileSync(process.env.OBSERVED_ENV_OUT, JSON.stringify({cmd: process.argv.slice(1), MODEL_TRIAGE: process.env.MODEL_TRIAGE || null}) + "\\n")' "$@"
`);
  chmodSync(npmStub, 0o755);

  const claudeStub = path.join(binDir, 'claude');
  writeFileSync(claudeStub, `#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >"$CLAUDE_REFRESH_OUT"
node -e 'const fs=require("fs"), path=require("path"); fs.writeFileSync(path.join(process.env.CLAUDE_CONFIG_DIR, ".credentials.json"), JSON.stringify({claudeAiOauth:{accessToken:"fresh-access", expiresAt: Date.now()+3600000}}))'
printf 'OK\n'
`);
  chmodSync(claudeStub, 0o755);

  const result = spawnSync('bash', ['scripts/local_run.sh', 'process'], {
    cwd: repoRoot,
    env: {
      PATH: `${binDir}:${process.env.PATH}`,
      CYBER_NEWS_APP_HOME: appHome,
      CYBER_NEWS_ENV_FILE: envFile,
      CYBER_NEWS_REPO: repoRoot,
      LLM_AUTH_MODE: '',
      ANTHROPIC_API_KEY: '',
    },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(readFileSync(refreshOut, 'utf8'), /-p --max-turns 1/);
  const rows = readFileSync(observed, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(rows.length, 2);
});
