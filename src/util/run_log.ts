// Run-log NDJSON writer. Per docs/observability-plan.md PR 1.
//
// Two-tier persistence: per-run NDJSON under logs/runs/{date}/{stage}-{runId}.ndjson
// captures every model call and lifecycle event; INDEX.ndjson is the
// append-only digest a coding agent reads first to discover runs.
//
// Kill-switch: RUN_LOG_DISABLED=1 → NOOP_LOGGER (no I/O at all).

import { createWriteStream, mkdirSync, type WriteStream } from "node:fs";
import { appendFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";

export const SCHEMA_VERSION = 1;

export interface ModelCallLog {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  duration_ms: number;
  payload_digest?: string;
  raw_output?: string;
  error?: string;
}

export interface RunLogger {
  runId: string;
  stage: string;
  logCall(p: ModelCallLog): void;
  logEvent(p: { event: string; [k: string]: unknown }): void;
  finishRun(summary: Record<string, unknown>): Promise<void>;
}

export interface StartRunOptions {
  /** Override repo root (defaults to process.cwd()). */
  root?: string;
  /** Override clock for tests. */
  now?: () => Date;
  /** Override env source. */
  env?: NodeJS.ProcessEnv;
  /** Override git_sha resolution (tests). */
  gitSha?: () => string;
}

class NoopLogger implements RunLogger {
  runId = "";
  stage = "";
  logCall(): void {}
  logEvent(): void {}
  async finishRun(): Promise<void> {}
}

export const NOOP_LOGGER: RunLogger = new NoopLogger();

/**
 * Start a new run. Opens an NDJSON write stream, emits run_start, and returns
 * a RunLogger. finishRun() must be awaited at process exit; wrap in try/finally
 * at entry points so partial logs survive a crash.
 */
export function startRun(stage: string, options: StartRunOptions = {}): RunLogger {
  const env = options.env ?? process.env;
  if (env.RUN_LOG_DISABLED === "1") return NOOP_LOGGER;

  const root = options.root ?? process.cwd();
  const hasCustomLogRoot = env.RUN_LOG_DIR !== undefined && env.RUN_LOG_DIR.length > 0;
  const logRoot = hasCustomLogRoot ? env.RUN_LOG_DIR! : path.join(root, "logs");
  const now = options.now ?? (() => new Date());
  const startedAt = now();
  const runId = randomBytes(4).toString("hex");
  const dateDir = startedAt.toISOString().slice(0, 10); // YYYY-MM-DD
  const dir = path.join(logRoot, "runs", dateDir);
  const file = path.join(dir, `${stage}-${runId}.ndjson`);
  const indexPath = path.join(logRoot, "runs", "INDEX.ndjson");
  const relFile = hasCustomLogRoot
    ? file
    : path.posix.join("logs", "runs", dateDir, `${stage}-${runId}.ndjson`);

  mkdirSync(dir, { recursive: true });
  const stream = createWriteStream(file, { flags: "a" });

  const gitSha = (options.gitSha ?? defaultGitSha)();
  const dryRun = env.DRY_RUN === "1";
  const modelsActive = collectModelEnv(env);

  const logger = new NdjsonLogger({
    runId,
    stage,
    stream,
    indexPath,
    file: relFile,
    startedAt,
    gitSha,
    dryRun,
    now,
  });

  logger.logEvent({
    event: "run_start",
    git_sha: gitSha,
    models_active: modelsActive,
    dry_run: dryRun,
    node_env: env.NODE_ENV ?? null,
    cwd: root,
  });

  return logger;
}

class NdjsonLogger implements RunLogger {
  readonly runId: string;
  readonly stage: string;
  private readonly stream: WriteStream;
  private readonly indexPath: string;
  private readonly file: string;
  private readonly startedAt: Date;
  private readonly gitSha: string;
  private readonly dryRun: boolean;
  private readonly now: () => Date;
  private finished = false;

  constructor(opts: {
    runId: string;
    stage: string;
    stream: WriteStream;
    indexPath: string;
    file: string;
    startedAt: Date;
    gitSha: string;
    dryRun: boolean;
    now: () => Date;
  }) {
    this.runId = opts.runId;
    this.stage = opts.stage;
    this.stream = opts.stream;
    this.indexPath = opts.indexPath;
    this.file = opts.file;
    this.startedAt = opts.startedAt;
    this.gitSha = opts.gitSha;
    this.dryRun = opts.dryRun;
    this.now = opts.now;
  }

  logCall(p: ModelCallLog): void {
    this.write({ event: "model_call", ...p });
  }

  logEvent(p: { event: string; [k: string]: unknown }): void {
    this.write(p);
  }

  async finishRun(summary: Record<string, unknown>): Promise<void> {
    if (this.finished) return;
    const finishedAt = this.now();
    const duration_ms = finishedAt.getTime() - this.startedAt.getTime();

    // Write the run_summary line before flipping `finished`, so the guard in
    // write() doesn't drop it.
    this.write({
      event: "run_summary",
      finished_at: finishedAt.toISOString(),
      duration_ms,
      summary,
    });
    this.finished = true;

    await new Promise<void>((resolve, reject) => {
      this.stream.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });

    const indexRow = {
      schema_version: SCHEMA_VERSION,
      run_id: this.runId,
      stage: this.stage,
      started_at: this.startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms,
      git_sha: this.gitSha,
      dry_run: this.dryRun,
      summary,
      file: this.file,
    };
    // Single sub-PIPE_BUF write keeps appends atomic across concurrent
    // processes (Linux guarantees atomicity for writes ≤ PIPE_BUF / 4096 B).
    await appendFile(this.indexPath, JSON.stringify(indexRow) + "\n");
  }

  private write(payload: Record<string, unknown>): void {
    if (this.finished) return;
    const line =
      JSON.stringify({
        schema_version: SCHEMA_VERSION,
        run_id: this.runId,
        stage: this.stage,
        ts: this.now().toISOString(),
        ...payload,
      }) + "\n";
    this.stream.write(line);
  }
}

function collectModelEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    if (k.startsWith("MODEL_") && typeof v === "string" && v.length > 0) {
      out[k] = v;
    }
  }
  return out;
}

function defaultGitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    // execFile (no shell) — avoids the command-injection class entirely.
    return execFileSync("git", ["rev-parse", "HEAD"], { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}
