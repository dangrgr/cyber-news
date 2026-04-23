// Extract fixtures. Article bodies are paraphrased — this repo is personal-scale
// and stays copyright-clean.

import type { ExtractionInput, ExtractionOutput } from "../../../src/patterns/types.ts";

export interface ExtractFixture {
  name: string;
  input: ExtractionInput;
  mockedResponse: string;
  expectedOutput: ExtractionOutput;
}

// Co-mention trap: the article describes a Cisco breach, but also mentions
// Boeing and Lockheed Martin as prior SLH victims from earlier months.
// The extract must split victim_orgs_confirmed (Cisco) vs orgs_mentioned
// (Boeing, Lockheed Martin).
export const FIX_COMENTION_CISCO: ExtractFixture = {
  name: "co-mention guard: Cisco is the victim, Boeing and Lockheed are context",
  input: {
    url: "https://krebsonsecurity.com/2026/04/shinyhunters-cisco",
    source: "Krebs on Security",
    published_at: "2026-04-20T08:00:00.000Z",
    chunk_index: "0",
    total_chunks: "1",
    raw_text:
      "ShinyHunters, part of the SLH alliance, claims it stole 4.2 million records from Cisco's Salesforce instance " +
      "using a vishing call to a contractor. Cisco confirmed unauthorized third-party access in an SEC 8-K filing. " +
      "Earlier this year, SLH also hit Boeing and Lockheed Martin as part of the same Salesforce campaign.",
  },
  mockedResponse: JSON.stringify({
    title: "ShinyHunters claims Cisco data theft via Salesforce vishing",
    summary:
      "ShinyHunters claims 4.2M records stolen from Cisco's Salesforce; Cisco confirmed unauthorized access via SEC 8-K. Boeing and Lockheed were also hit earlier in the campaign.",
    victim_orgs_confirmed: ["Cisco"],
    orgs_mentioned: ["Boeing", "Lockheed Martin"],
    threat_actors_attributed: ["ShinyHunters"],
    actors_mentioned: ["SLH"],
    cves: [],
    initial_access_vector: "vishing call to a contractor",
    ttps: [],
    impact: {
      affected_count: 4200000,
      affected_count_unit: "records",
      data_exfil_size: null,
      sector: null,
      geographic_scope: null,
      service_disruption: null,
    },
    incident_date: null,
    confidence: "claim",
    claim_markers_observed: ["claims"],
    primary_source: "article_itself",
  }),
  expectedOutput: {
    title: "ShinyHunters claims Cisco data theft via Salesforce vishing",
    summary:
      "ShinyHunters claims 4.2M records stolen from Cisco's Salesforce; Cisco confirmed unauthorized access via SEC 8-K. Boeing and Lockheed were also hit earlier in the campaign.",
    victim_orgs_confirmed: ["Cisco"],
    orgs_mentioned: ["Boeing", "Lockheed Martin"],
    threat_actors_attributed: ["ShinyHunters"],
    actors_mentioned: ["SLH"],
    cves: [],
    initial_access_vector: "vishing call to a contractor",
    ttps: [],
    impact: {
      affected_count: 4200000,
      affected_count_unit: "records",
      data_exfil_size: null,
      sector: null,
      geographic_scope: null,
      service_disruption: null,
    },
    incident_date: null,
    confidence: "claim",
    claim_markers_observed: ["claims"],
    primary_source: "article_itself",
  },
};

export const FIX_CVE_ADVISORY: ExtractFixture = {
  name: "CVE advisory: KEV listing, confirmed by vendor",
  input: {
    url: "https://www.bleepingcomputer.com/2026/04/fortinet-cve-2026-31200",
    source: "BleepingComputer",
    published_at: "2026-04-22T12:00:00.000Z",
    chunk_index: "0",
    total_chunks: "1",
    raw_text:
      "Fortinet disclosed CVE-2026-31200, an authentication bypass in FortiOS, confirmed under active exploitation. " +
      "CISA added it to the KEV catalog. Organizations running FortiOS 7.0-7.4 should patch immediately.",
  },
  mockedResponse: JSON.stringify({
    title: "Fortinet discloses CVE-2026-31200 authentication bypass under active exploitation",
    summary: "Fortinet confirmed CVE-2026-31200 is under active exploitation; CISA added it to KEV.",
    victim_orgs_confirmed: [],
    orgs_mentioned: ["Fortinet"],
    threat_actors_attributed: [],
    actors_mentioned: [],
    cves: ["CVE-2026-31200"],
    initial_access_vector: "authentication bypass",
    ttps: [],
    impact: {
      affected_count: null,
      affected_count_unit: null,
      data_exfil_size: null,
      sector: null,
      geographic_scope: null,
      service_disruption: null,
    },
    incident_date: null,
    confidence: "confirmed",
    claim_markers_observed: [],
    primary_source: "cited_vendor_advisory",
  }),
  expectedOutput: {
    title: "Fortinet discloses CVE-2026-31200 authentication bypass under active exploitation",
    summary: "Fortinet confirmed CVE-2026-31200 is under active exploitation; CISA added it to KEV.",
    victim_orgs_confirmed: [],
    orgs_mentioned: ["Fortinet"],
    threat_actors_attributed: [],
    actors_mentioned: [],
    cves: ["CVE-2026-31200"],
    initial_access_vector: "authentication bypass",
    ttps: [],
    impact: {
      affected_count: null,
      affected_count_unit: null,
      data_exfil_size: null,
      sector: null,
      geographic_scope: null,
      service_disruption: null,
    },
    incident_date: null,
    confidence: "confirmed",
    claim_markers_observed: [],
    primary_source: "cited_vendor_advisory",
  },
};

export const ALL_EXTRACT_FIXTURES: readonly ExtractFixture[] = [FIX_COMENTION_CISCO, FIX_CVE_ADVISORY] as const;
