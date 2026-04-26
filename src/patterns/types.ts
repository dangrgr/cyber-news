// TypeScript shapes mirroring patterns/*/schema.json. These are authoritative
// for TS callers; the JSON Schema files are authoritative for the LLM contract.
// If they drift, `validate()` errors will surface the mismatch at runtime.

// ---------- Triage (PRD §10.1) ----------

export interface TriageInput {
  title: string;
  url: string;
  source: string;
  published_at: string;
  body_1500: string;
  nearest_incident_json_or_null: string; // pre-stringified JSON or the literal "null"
}

export interface TriageOutput {
  decision: "process" | "skip";
  novel: boolean;
  significant: boolean;
  duplicate_of: string | null;
  reason: string;
}

// ---------- Extraction (PRD §10.2) ----------

export type Confidence = "claim" | "reported" | "confirmed";

export interface ExtractionInput {
  url: string;
  source: string;
  published_at: string;
  chunk_index: string; // stringified for template; runner converts
  total_chunks: string;
  raw_text: string;
}

export interface ExtractionImpact {
  affected_count: number | null;
  affected_count_unit: string | null;
  data_exfil_size: string | null;
  sector: string | null;
  geographic_scope: string | null;
  service_disruption: string | null;
}

export interface ExtractionOutput {
  title: string;
  summary: string;
  victim_orgs_confirmed: string[];
  orgs_mentioned: string[];
  threat_actors_attributed: string[];
  actors_mentioned: string[];
  cves: string[];
  initial_access_vector: string | null;
  ttps: string[];
  impact: ExtractionImpact;
  incident_date: string | null;
  confidence: Confidence;
  claim_markers_observed: string[];
  primary_source:
    | "article_itself"
    | "cited_vendor_advisory"
    | "cited_gov_advisory"
    | "cited_security_firm"
    | "aggregated";
}

// ---------- Factcheck (PRD §10.3) ----------

export interface FactcheckInput {
  raw_text: string;
  extraction_json: string; // pre-stringified JSON
}

export type FactcheckVerdict = "UNSUPPORTED" | "OVERREACH" | "RELATIONSHIP_UNSUPPORTED";

export interface FactcheckIssue {
  field: string;
  verdict: FactcheckVerdict;
  article_evidence: string | null;
  detail: string;
}

export interface FactcheckOutput {
  overall: "pass" | "fail";
  issues: FactcheckIssue[];
}

// ---------- Vendor doc review (PRD §10.5) ----------

export interface VendorDocReviewInput {
  url: string;
  vendor: string;          // "" if unknown
  document_text: string;
}

export interface CvssScore {
  cve: string;
  version: "2.0" | "3.0" | "3.1" | "4.0";
  score: number;
  severity: "none" | "low" | "medium" | "high" | "critical";
  vector: string;
}

export interface VendorDocReviewOutput {
  vendor: string;
  product: string;
  advisory_id: string | null;
  advisory_url: string;
  cves: string[];
  cvss_scores: CvssScore[];
  affected_versions: string[];
  fixed_versions: string[];
  exploitation_status:
    | "none_observed"
    | "proof_of_concept"
    | "in_the_wild"
    | "under_active_exploitation"
    | "unknown";
  kev_listed: boolean | null;
  disclosure_date: string | null;
  patch_released_date: string | null;
  mitigation_available: boolean;
  mitigation_summary: string | null;
  workaround_summary: string | null;
  attack_complexity: "low" | "high" | null;
  attack_vector: "network" | "adjacent" | "local" | "physical" | null;
  requires_user_interaction: boolean | null;
  requires_authentication: "none" | "low" | "high" | null;
  scope_changed: boolean | null;
  credit: string[];
  notes: string | null;
}
