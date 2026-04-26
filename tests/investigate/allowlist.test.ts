import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_ALLOWLIST, isAllowed } from "../../src/investigate/allowlist.ts";

describe("allowlist", () => {
  it("allows exact-match host on the allowlist", () => {
    assert.equal(isAllowed("https://krebsonsecurity.com/path"), true);
    assert.equal(isAllowed("https://www.bleepingcomputer.com/a"), true);
  });

  it("allows wildcard-prefixed subdomains", () => {
    assert.equal(isAllowed("https://foo.talosintelligence.com/x"), true);
    assert.equal(isAllowed("https://a.b.talosintelligence.com/x"), true);
    assert.equal(isAllowed("https://my-db.turso.io/pipe"), true);
  });

  it("rejects the bare suffix of a wildcard entry", () => {
    // *.talosintelligence.com matches subdomains only, not the apex.
    assert.equal(isAllowed("https://talosintelligence.com/"), false);
  });

  it("rejects unrelated hosts that end with an allowed suffix only by coincidence", () => {
    assert.equal(isAllowed("https://evil-krebsonsecurity.com/"), false);
    assert.equal(isAllowed("https://krebsonsecurity.com.evil.io/"), false);
  });

  it("rejects non-http schemes", () => {
    assert.equal(isAllowed("file:///etc/passwd"), false);
    assert.equal(isAllowed("ftp://krebsonsecurity.com/x"), false);
  });

  it("rejects malformed URLs", () => {
    assert.equal(isAllowed("not a url"), false);
    assert.equal(isAllowed(""), false);
  });

  it("is case-insensitive on host", () => {
    assert.equal(isAllowed("https://KREBSONSECURITY.com/"), true);
    assert.equal(isAllowed("https://FOO.Turso.IO/pipe"), true);
  });

  it("custom allowlist override", () => {
    assert.equal(isAllowed("https://example.test/x", ["example.test"]), true);
    assert.equal(isAllowed("https://krebsonsecurity.com/", ["example.test"]), false);
  });

  it("includes expected tier-1 and gov sources", () => {
    for (const host of ["krebsonsecurity.com", "therecord.media", "news.risky.biz", "services.nvd.nist.gov", "www.cisa.gov"]) {
      assert.ok(DEFAULT_ALLOWLIST.includes(host), `allowlist missing: ${host}`);
    }
  });
});
