import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  bodyWordCount,
  extractArticleBodyDetailed,
  resolveArticleBody,
  type ExtractionResult,
} from "../../src/ingest/fetcher.ts";

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

  it("does not eat `<...>` spans in plain prose (only real tags are stripped)", () => {
    // The old `/<[^>]+>/g` deleted everything from `<` to `>`, collapsing the
    // first string to 2 "words". A real tag needs a letter/`/` right after `<`,
    // so here nothing is stripped and the lone `<`/`>` remain as tokens.
    assert.equal(bodyWordCount("5 < 10 and x > 3"), 7);
    assert.equal(bodyWordCount("set payload < 2KB please"), 5);
  });

  it("treats &nbsp;-family entities as word boundaries, not glue", () => {
    assert.equal(bodyWordCount("a&nbsp;b"), 2);
    assert.equal(bodyWordCount("a&#160;b&#xA0;c"), 3);
  });
});

describe("extractArticleBodyDetailed", () => {
  it("suppresses benign jsdom CSS parser noise while extracting article text", async () => {
    const previousFetch = globalThis.fetch;
    const previousConsoleError = console.error;
    const errors: unknown[][] = [];

    globalThis.fetch = async () =>
      new Response(
        `<!doctype html>
        <html>
          <head><style>@scope (.article) { p { color: red } }</style></head>
          <body>
            <article>
              <h1>Important breach confirmed</h1>
              <p>Attackers exploited a real vulnerability and defenders need clear details.</p>
            </article>
          </body>
        </html>`,
        { status: 200, headers: { "Content-Type": "text/html" } },
      );
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };

    try {
      const result = await extractArticleBodyDetailed("https://example.com/article");

      assert.equal(result.fallbackReason, null);
      assert.match(result.text ?? "", /Important breach confirmed/);
      assert.equal(
        errors.some((args) =>
          args.some((arg) => String(arg).includes("Could not parse CSS stylesheet")),
        ),
        false,
      );
    } finally {
      globalThis.fetch = previousFetch;
      console.error = previousConsoleError;
    }
  });
});

const readability = (text: string): (() => Promise<ExtractionResult>) =>
  async () => ({ text, fallbackReason: null });
const fellBack = (
  fallbackReason: ExtractionResult["fallbackReason"],
): (() => Promise<ExtractionResult>) =>
  async () => ({ text: null, fallbackReason });

describe("resolveArticleBody", () => {
  it("uses readability text when the extractor returns content", async () => {
    const r = await resolveArticleBody(
      "https://example.com/a",
      "rss snippet fallback",
      readability("full readability body with six words"),
    );
    assert.equal(r.method, "readability");
    assert.equal(r.text, "full readability body with six words");
    assert.equal(r.wordCount, 6);
    assert.equal(r.fallbackReason, null);
  });

  it("falls back to RSS content and carries the failure reason", async () => {
    const r = await resolveArticleBody(
      "https://example.com/b",
      "<p>rss only body</p>",
      fellBack("fetch_error"),
    );
    assert.equal(r.method, "rss_fallback");
    assert.equal(r.text, "<p>rss only body</p>");
    assert.equal(r.wordCount, 3);
    assert.equal(r.fallbackReason, "fetch_error");
  });

  it("preserves the specific fallback category (http_error vs empty_extraction)", async () => {
    const http = await resolveArticleBody("https://example.com/c", "snip", fellBack("http_error"));
    assert.equal(http.fallbackReason, "http_error");
    const empty = await resolveArticleBody(
      "https://example.com/d",
      "snip",
      fellBack("empty_extraction"),
    );
    assert.equal(empty.method, "rss_fallback");
    assert.equal(empty.fallbackReason, "empty_extraction");
  });
});
