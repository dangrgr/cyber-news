// Paragraph-level article chunker, per PRD §10.2.
// Strategy: split on paragraph boundaries, greedy-fill chunks up to a target
// word count, cap at a maximum number of chunks. Over the cap, return the
// first N chunks and a flag so the caller can log a sidecar warning.

export interface ChunkingOptions {
  /** Articles ≤ this many words are passed through as a single chunk. */
  splitThresholdWords?: number;
  /** Target upper bound per chunk, aiming to leave headroom. */
  targetWordsPerChunk?: number;
  /** Maximum number of chunks produced; content past this is truncated. */
  maxChunks?: number;
}

export interface ChunkingResult {
  chunks: string[];
  truncated: boolean;
}

const DEFAULTS: Required<ChunkingOptions> = {
  splitThresholdWords: 1500,
  targetWordsPerChunk: 1200,
  maxChunks: 4,
};

/**
 * Paragraph-boundary chunker. Paragraph boundaries are defined as one or more
 * blank lines; this matches how readability-extracted bodies look in the DB.
 * A single paragraph longer than targetWordsPerChunk becomes its own chunk
 * (we don't split mid-paragraph — that would mangle sentence boundaries).
 */
export function chunkArticle(raw: string, opts: ChunkingOptions = {}): ChunkingResult {
  const o = { ...DEFAULTS, ...opts };
  const totalWords = countWords(raw);
  if (totalWords <= o.splitThresholdWords) {
    return { chunks: [raw], truncated: false };
  }

  const paragraphs = splitParagraphs(raw);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const p of paragraphs) {
    const pWords = countWords(p);
    if (current.length === 0) {
      current.push(p);
      currentWords = pWords;
      continue;
    }
    if (currentWords + pWords > o.targetWordsPerChunk) {
      chunks.push(current.join("\n\n"));
      if (chunks.length >= o.maxChunks) break;
      current = [p];
      currentWords = pWords;
    } else {
      current.push(p);
      currentWords += pWords;
    }
  }
  if (current.length > 0 && chunks.length < o.maxChunks) {
    chunks.push(current.join("\n\n"));
  }

  const truncated = chunks.length === o.maxChunks && sumWords(chunks) < totalWords;
  return { chunks, truncated };
}

function countWords(s: string): number {
  return s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;
}

function sumWords(xs: string[]): number {
  return xs.reduce((acc, s) => acc + countWords(s), 0);
}

function splitParagraphs(raw: string): string[] {
  return raw
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
