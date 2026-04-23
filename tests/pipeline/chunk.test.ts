import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { chunkArticle } from "../../src/pipeline/chunk.ts";

function paragraph(words: number, tag: string): string {
  return Array.from({ length: words }, (_, i) => `${tag}${i}`).join(" ");
}

describe("chunkArticle: short articles", () => {
  it("passes short articles through as a single chunk", () => {
    const text = paragraph(800, "w");
    const r = chunkArticle(text);
    assert.equal(r.chunks.length, 1);
    assert.equal(r.truncated, false);
    assert.equal(r.chunks[0], text);
  });

  it("uses the default threshold of 1500 words", () => {
    const text = [paragraph(750, "a"), paragraph(750, "b")].join("\n\n");
    const r = chunkArticle(text);
    assert.equal(r.chunks.length, 1);
  });
});

describe("chunkArticle: multi-chunk", () => {
  it("splits at paragraph boundaries, greedy-filling to targetWordsPerChunk", () => {
    // p1 (500) + p2 (500) = 1000 fits in chunk 0 (≤ 1200).
    // p3 (900) would push chunk 0 to 1900, so it starts a new chunk.
    const text = [
      paragraph(500, "p1"),
      paragraph(500, "p2"),
      paragraph(900, "p3"),
    ].join("\n\n");
    const r = chunkArticle(text, { splitThresholdWords: 1500, targetWordsPerChunk: 1200, maxChunks: 4 });
    assert.equal(r.chunks.length, 2);
    assert.equal(r.truncated, false);
    assert.ok(r.chunks[0]!.includes("p10"));
    assert.ok(r.chunks[0]!.includes("p20"), "p2 should be packed into chunk 0 (fits within target)");
    assert.ok(!r.chunks[0]!.includes("p30"), "p3 should not be in chunk 0");
    assert.ok(r.chunks[1]!.includes("p30"));
  });

  it("starts a new chunk when adding the next paragraph would exceed the target", () => {
    // p1 (800) already > target/2; p2 (600) would push to 1400 > 1200, so new chunk.
    const text = [
      paragraph(800, "p1"),
      paragraph(600, "p2"),
      paragraph(900, "p3"),
    ].join("\n\n");
    const r = chunkArticle(text, { splitThresholdWords: 1500, targetWordsPerChunk: 1200, maxChunks: 4 });
    // Each paragraph ends up in its own chunk because no consecutive pair fits.
    assert.equal(r.chunks.length, 3);
    assert.equal(r.truncated, false);
  });

  it("puts oversized single paragraphs into their own chunk (no mid-paragraph split)", () => {
    const huge = paragraph(2000, "huge");
    const r = chunkArticle(huge, { splitThresholdWords: 1500, targetWordsPerChunk: 1200, maxChunks: 4 });
    // The whole huge paragraph is ONE paragraph; we don't split it.
    assert.equal(r.chunks.length, 1);
    assert.equal(r.chunks[0], huge);
  });
});

describe("chunkArticle: truncation cap", () => {
  it("caps at maxChunks and flags truncated when content is dropped", () => {
    const paragraphs = Array.from({ length: 10 }, (_, i) => paragraph(1000, `p${i}_`));
    const text = paragraphs.join("\n\n");
    const r = chunkArticle(text, { splitThresholdWords: 1500, targetWordsPerChunk: 1200, maxChunks: 3 });
    assert.equal(r.chunks.length, 3);
    assert.equal(r.truncated, true);
  });

  it("does not flag truncated when exactly maxChunks worth fits", () => {
    const paragraphs = [paragraph(1100, "a"), paragraph(1100, "b")];
    const text = paragraphs.join("\n\n");
    const r = chunkArticle(text, { splitThresholdWords: 1500, targetWordsPerChunk: 1200, maxChunks: 2 });
    assert.equal(r.chunks.length, 2);
    assert.equal(r.truncated, false);
  });
});
