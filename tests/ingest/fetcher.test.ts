import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { bodyWordCount, resolveArticleBody } from "../../src/ingest/fetcher.ts";

describe("bodyWordCount", () => {
  it("counts whitespace-separated words", () => {
    assert.equal(bodyWordCount("one two three"), 3);
  });

  it("strips HTML tags before counting so RSS HTML and plain text compare", () => {
    // 4 words of content; tags must not inflate the count.
    assert.equal(bodyWordCount("<p>hello <b>brave</b> new world</p>"), 4);
  });

  it("returns 0 for empty / whitespace-only / tag-only input", () => {
    assert.equal(bodyWordCount(""), 0);
    assert.equal(bodyWordCount("   \n  "), 0);
    assert.equal(bodyWordCount("<br/><hr/>"), 0);
  });
});

describe("resolveArticleBody", () => {
  it("uses readability text when the extractor returns content", async () => {
    const r = await resolveArticleBody(
      "https://example.com/a",
      "rss snippet fallback",
      async () => "full readability body with five words",
    );
    assert.equal(r.method, "readability");
    assert.equal(r.text, "full readability body with five words");
    assert.equal(r.wordCount, 6);
  });

  it("falls back to RSS content when the extractor returns null", async () => {
    const r = await resolveArticleBody(
      "https://example.com/b",
      "<p>rss only body</p>",
      async () => null,
    );
    assert.equal(r.method, "rss_fallback");
    assert.equal(r.text, "<p>rss only body</p>");
    assert.equal(r.wordCount, 3);
  });

  it("treats an empty-string readability result as a fallback (not a valid body)", async () => {
    const r = await resolveArticleBody(
      "https://example.com/c",
      "rss fallback wins",
      async () => "",
    );
    assert.equal(r.method, "rss_fallback");
    assert.equal(r.text, "rss fallback wins");
  });
});
