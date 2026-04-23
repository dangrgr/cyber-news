import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canonicalizeUrl, articleId } from "../src/ingest/canonicalize.ts";

describe("canonicalizeUrl", () => {
  it("strips utm_* tracking params", () => {
    const out = canonicalizeUrl(
      "https://krebsonsecurity.com/foo?utm_source=rss&utm_medium=feed&id=42",
    );
    assert.equal(out, "https://krebsonsecurity.com/foo?id=42");
  });

  it("removes fbclid, gclid, msclkid", () => {
    const out = canonicalizeUrl(
      "https://example.com/x?fbclid=abc&gclid=def&msclkid=ghi&kept=1",
    );
    assert.equal(out, "https://example.com/x?kept=1");
  });

  it("lowercases the host but preserves the path case", () => {
    const out = canonicalizeUrl("HTTPS://Krebsonsecurity.COM/Path/Article");
    assert.equal(out, "https://krebsonsecurity.com/Path/Article");
  });

  it("drops the URL fragment", () => {
    const out = canonicalizeUrl("https://example.com/post#section-2");
    assert.equal(out, "https://example.com/post");
  });

  it("drops a trailing slash on non-root paths but keeps it on the root", () => {
    assert.equal(canonicalizeUrl("https://example.com/foo/"), "https://example.com/foo");
    assert.equal(canonicalizeUrl("https://example.com/"), "https://example.com/");
  });

  it("drops default ports", () => {
    assert.equal(canonicalizeUrl("https://example.com:443/foo"), "https://example.com/foo");
    assert.equal(canonicalizeUrl("http://example.com:80/foo"), "http://example.com/foo");
  });

  it("yields stable sha256 ids for equivalent URLs", () => {
    const a = canonicalizeUrl("https://example.com/foo?utm_source=rss");
    const b = canonicalizeUrl("HTTPS://Example.com/foo/?utm_source=newsletter#x");
    assert.equal(articleId(a), articleId(b));
  });
});
