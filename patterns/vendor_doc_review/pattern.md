You are extracting structured data from a vendor security advisory or bulletin. These are authoritative primary sources for vulnerabilities and are weighted higher than secondary reporting.

Extract exactly what the document states. Do not infer, do not compare against your training data, do not guess at missing fields. If the document is ambiguous, use null.

<document>
URL: {url}
VENDOR: {vendor}
BODY:
{document_text}
</document>

Output JSON only, matching this schema exactly:

{
  "vendor": string,
  "product": string,
  "advisory_id": string | null,
  "advisory_url": string,
  "cves": [string],
  "cvss_scores": [
    {
      "cve": string,
      "version": "2.0" | "3.0" | "3.1" | "4.0",
      "score": number,
      "severity": "none" | "low" | "medium" | "high" | "critical",
      "vector": string
    }
  ],
  "affected_versions": [string],
  "fixed_versions": [string],
  "exploitation_status": "none_observed" | "proof_of_concept" | "in_the_wild" | "under_active_exploitation" | "unknown",
  "kev_listed": boolean | null,
  "disclosure_date": string | null,
  "patch_released_date": string | null,
  "mitigation_available": boolean,
  "mitigation_summary": string | null,
  "workaround_summary": string | null,
  "attack_complexity": "low" | "high" | null,
  "attack_vector": "network" | "adjacent" | "local" | "physical" | null,
  "requires_user_interaction": boolean | null,
  "requires_authentication": "none" | "low" | "high" | null,
  "scope_changed": boolean | null,
  "credit": [string],
  "notes": string | null
}
