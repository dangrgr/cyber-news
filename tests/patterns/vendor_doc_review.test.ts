import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type { AnthropicClient, MessagesCreateParams, MessagesCreateResult } from "../../src/clients/anthropic.ts";
import { runPattern, resetPatternCaches, PatternSchemaError } from "../../src/patterns/runner.ts";
import { VENDOR_DOC_REVIEW_PATTERN } from "../../src/patterns/registry.ts";

function mockClient(responses: string[]): { client: AnthropicClient; calls: MessagesCreateParams[] } {
  const calls: MessagesCreateParams[] = [];
  let i = 0;
  return {
    calls,
    client: {
      async messagesCreate(params: MessagesCreateParams): Promise<MessagesCreateResult> {
        calls.push(params);
        if (i >= responses.length) throw new Error(`unexpected call #${i + 1}`);
        const text = responses[i]!;
        i++;
        return { text, usage: { input_tokens: 100, output_tokens: 50 }, model: params.model };
      },
    },
  };
}

function validOutput() {
  return {
    vendor: "Cisco",
    product: "IOS XE",
    advisory_id: "cisco-sa-iosxe-webui-privesc",
    advisory_url: "https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-iosxe-webui-privesc",
    cves: ["CVE-2024-20399"],
    cvss_scores: [
      {
        cve: "CVE-2024-20399",
        version: "3.1",
        score: 6.0,
        severity: "medium",
        vector: "CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H",
      },
    ],
    affected_versions: ["17.9.x", "17.10.x"],
    fixed_versions: ["17.9.5", "17.10.1a"],
    exploitation_status: "under_active_exploitation",
    kev_listed: true,
    disclosure_date: "2024-07-01",
    patch_released_date: "2024-07-01",
    mitigation_available: true,
    mitigation_summary: "Restrict admin access.",
    workaround_summary: null,
    attack_complexity: "low",
    attack_vector: "local",
    requires_user_interaction: false,
    requires_authentication: "high",
    scope_changed: false,
    credit: ["Cisco TAC"],
    notes: null,
  };
}

beforeEach(() => resetPatternCaches());

describe("vendor_doc_review pattern", () => {
  it("parses and validates a canonical vendor advisory response", async () => {
    const { client, calls } = mockClient([JSON.stringify(validOutput())]);
    const result = await runPattern(
      VENDOR_DOC_REVIEW_PATTERN,
      {
        url: "https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-iosxe-webui-privesc",
        vendor: "Cisco",
        document_text: "Cisco Security Advisory — CVE-2024-20399 affects IOS XE 17.9 and 17.10.",
      },
      {
        anthropic: client,
        env: { MODEL_VENDOR_DOC_REVIEW: "claude-haiku-4-5" },
      },
    );
    assert.equal(result.retries, 0);
    assert.equal(result.output.vendor, "Cisco");
    assert.equal(result.output.cves[0], "CVE-2024-20399");
    assert.equal(result.output.kev_listed, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0]!.system, /vendor security advisory/i);
  });

  it("rejects output missing required fields", async () => {
    const partial = { ...validOutput() };
    delete (partial as Record<string, unknown>).exploitation_status;
    const { client } = mockClient([JSON.stringify(partial)]);
    await assert.rejects(
      runPattern(
        VENDOR_DOC_REVIEW_PATTERN,
        { url: "https://msrc.microsoft.com/x", vendor: "", document_text: "body" },
        {
          anthropic: client,
          env: { MODEL_VENDOR_DOC_REVIEW: "claude-haiku-4-5" },
        },
      ),
      PatternSchemaError,
    );
  });

  it("on-disk schema and prompt are syntactically valid", async () => {
    const schema = await readFile("patterns/vendor_doc_review/schema.json", "utf-8");
    const parsed = JSON.parse(schema);
    assert.equal(parsed.type, "object");
    assert.ok(Array.isArray(parsed.required));
    const prompt = await readFile("patterns/vendor_doc_review/pattern.md", "utf-8");
    assert.match(prompt, /VENDOR: \{vendor\}/);
    assert.match(prompt, /\{document_text\}/);
  });
});
