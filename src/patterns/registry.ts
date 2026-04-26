// Pattern definitions wire each pattern to its on-disk prompt, schema, model
// env var, and placeholder builder. Keeping these together keeps the runner
// itself generic.

import type { PatternDefinition } from "./runner.ts";
import type {
  ExtractionInput,
  ExtractionOutput,
  FactcheckInput,
  FactcheckOutput,
  TriageInput,
  TriageOutput,
  VendorDocReviewInput,
  VendorDocReviewOutput,
} from "./types.ts";

const PATTERNS_ROOT = "patterns";

export const TRIAGE_PATTERN: PatternDefinition<TriageInput, TriageOutput> = {
  name: "triage",
  promptPath: `${PATTERNS_ROOT}/triage/pattern.md`,
  schemaPath: `${PATTERNS_ROOT}/triage/schema.json`,
  modelEnvVar: "MODEL_TRIAGE",
  buildPlaceholders: (i) => ({
    title: i.title,
    url: i.url,
    source: i.source,
    published_at: i.published_at,
    body_1500: i.body_1500,
    nearest_incident_json_or_null: i.nearest_incident_json_or_null,
  }),
};

export const EXTRACT_PATTERN: PatternDefinition<ExtractionInput, ExtractionOutput> = {
  name: "extract",
  promptPath: `${PATTERNS_ROOT}/extract/pattern.md`,
  schemaPath: `${PATTERNS_ROOT}/extract/schema.json`,
  modelEnvVar: "MODEL_EXTRACTION",
  buildPlaceholders: (i) => ({
    url: i.url,
    source: i.source,
    published_at: i.published_at,
    chunk_index: i.chunk_index,
    total_chunks: i.total_chunks,
    raw_text: i.raw_text,
  }),
};

export const FACTCHECK_PATTERN: PatternDefinition<FactcheckInput, FactcheckOutput> = {
  name: "factcheck",
  promptPath: `${PATTERNS_ROOT}/factcheck/pattern.md`,
  schemaPath: `${PATTERNS_ROOT}/factcheck/schema.json`,
  modelEnvVar: "MODEL_FACTCHECK",
  buildPlaceholders: (i) => ({
    raw_text: i.raw_text,
    extraction_json: i.extraction_json,
  }),
};

export const VENDOR_DOC_REVIEW_PATTERN: PatternDefinition<
  VendorDocReviewInput,
  VendorDocReviewOutput
> = {
  name: "vendor_doc_review",
  promptPath: `${PATTERNS_ROOT}/vendor_doc_review/pattern.md`,
  schemaPath: `${PATTERNS_ROOT}/vendor_doc_review/schema.json`,
  modelEnvVar: "MODEL_VENDOR_DOC_REVIEW",
  buildPlaceholders: (i) => ({
    url: i.url,
    vendor: i.vendor,
    document_text: i.document_text,
  }),
};
