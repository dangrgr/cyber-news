// Triage test fixtures. Bodies are paraphrased, not verbatim from real articles,
// so this file stays copyright-clean if the repo ever goes public.

import type { TriageInput, TriageOutput } from "../../../src/patterns/types.ts";

export interface Fixture {
  name: string;
  input: TriageInput;
  mockedResponse: string;
  expectedOutput: TriageOutput;
}

const NO_NEAREST = "null";

export const FIX_PROCESS_KREBS_SHINY: Fixture = {
  name: "process: Krebs scoop on ShinyHunters + Cisco",
  input: {
    title: "ShinyHunters claims Cisco data theft tied to Salesforce vishing",
    url: "https://krebsonsecurity.com/2026/04/shinyhunters-cisco",
    source: "Krebs on Security",
    published_at: "2026-04-20T08:00:00.000Z",
    body_1500:
      "The extortion crew known as ShinyHunters, part of the SLH alliance, says it stole 4.2 million records " +
      "from Cisco's Salesforce instance using a vishing call to a contractor. Cisco confirmed unauthorized " +
      "third-party access in an SEC 8-K filing. The attack matches the pattern of the SLH Salesforce campaign " +
      "that has hit roughly 400 organizations since August 2025.",
    nearest_incident_json_or_null: NO_NEAREST,
  },
  mockedResponse: JSON.stringify({
    decision: "process",
    novel: true,
    significant: true,
    duplicate_of: null,
    reason: "Named victim (Cisco), named threat actor (ShinyHunters), confirmed by SEC 8-K, fits SLH campaign.",
    reason_code: null,
  }),
  expectedOutput: {
    decision: "process",
    novel: true,
    significant: true,
    duplicate_of: null,
    reason: "Named victim (Cisco), named threat actor (ShinyHunters), confirmed by SEC 8-K, fits SLH campaign.",
    reason_code: null,
  },
};

export const FIX_SKIP_VENDOR_MARKETING: Fixture = {
  name: "skip: vendor_marketing — vendor promo post with no incident",
  input: {
    title: "Why Zero Trust Is The Future Of Enterprise Security",
    url: "https://example-vendor.com/blog/zero-trust-future",
    source: "SecurityWeek",
    published_at: "2026-04-22T14:00:00.000Z",
    body_1500:
      "In today's rapidly evolving threat landscape, organizations must embrace a zero-trust architecture to " +
      "stay ahead of bad actors. Our platform provides best-in-class capabilities for identity verification, " +
      "micro-segmentation, and continuous monitoring. Contact us to schedule a demo.",
    nearest_incident_json_or_null: NO_NEAREST,
  },
  mockedResponse: JSON.stringify({
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Vendor marketing content; no named victim, actor, or incident.",
    reason_code: "vendor_marketing",
  }),
  expectedOutput: {
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Vendor marketing content; no named victim, actor, or incident.",
    reason_code: "vendor_marketing",
  },
};

export const FIX_SKIP_NEAR_DUPLICATE: Fixture = {
  name: "skip: duplicate — near-duplicate of existing incident, no new facts",
  input: {
    title: "ShinyHunters Cisco breach coverage summary",
    url: "https://secondary-site.com/shinyhunters-cisco-summary",
    source: "Security Affairs",
    published_at: "2026-04-21T10:00:00.000Z",
    body_1500:
      "Recapping the ShinyHunters Cisco incident: the group claims 4.2M records stolen via vishing. " +
      "This matches earlier reporting from Krebs. No new details beyond what Cisco has already confirmed.",
    nearest_incident_json_or_null: JSON.stringify({
      id: "inc-cisco-shiny-2026-04",
      title: "ShinyHunters claims Cisco data theft tied to Salesforce vishing",
      incident_date: "2026-04-20",
      summary: "SLH alliance's ShinyHunters claims 4.2M records exfiltrated from Cisco Salesforce.",
    }),
  },
  mockedResponse: JSON.stringify({
    decision: "skip",
    novel: false,
    significant: true,
    duplicate_of: "inc-cisco-shiny-2026-04",
    reason: "Recap of existing incident with no new facts beyond Krebs' original reporting.",
    reason_code: "duplicate",
  }),
  expectedOutput: {
    decision: "skip",
    novel: false,
    significant: true,
    duplicate_of: "inc-cisco-shiny-2026-04",
    reason: "Recap of existing incident with no new facts beyond Krebs' original reporting.",
    reason_code: "duplicate",
  },
};

export const FIX_PROCESS_CVE_ADVISORY: Fixture = {
  name: "process: CVE + exploitation-in-the-wild advisory",
  input: {
    title: "CVE-2026-31200: Active exploitation of Fortinet FortiOS zero-day",
    url: "https://www.bleepingcomputer.com/2026/04/fortinet-cve-2026-31200",
    source: "BleepingComputer",
    published_at: "2026-04-22T12:00:00.000Z",
    body_1500:
      "Fortinet has disclosed CVE-2026-31200, an authentication bypass in FortiOS under active exploitation. " +
      "CISA added it to the KEV catalog. Organizations running FortiOS 7.0-7.4 are urged to patch immediately.",
    nearest_incident_json_or_null: NO_NEAREST,
  },
  mockedResponse: JSON.stringify({
    decision: "process",
    novel: true,
    significant: true,
    duplicate_of: null,
    reason: "Named CVE, active exploitation, CISA KEV listing, named vendor.",
    reason_code: null,
  }),
  expectedOutput: {
    decision: "process",
    novel: true,
    significant: true,
    duplicate_of: null,
    reason: "Named CVE, active exploitation, CISA KEV listing, named vendor.",
    reason_code: null,
  },
};

export const FIX_SKIP_NOT_AN_INCIDENT: Fixture = {
  name: "skip: not_an_incident — opinion/commentary with no concrete incident",
  input: {
    title: "Why AI Will Change Cybersecurity Forever: An Opinion",
    url: "https://darkreading.com/2026/04/ai-cybersecurity-opinion",
    source: "Dark Reading",
    published_at: "2026-04-23T09:00:00.000Z",
    body_1500:
      "Opinion: artificial intelligence is poised to fundamentally reshape the cybersecurity landscape. " +
      "As defenders adopt AI-assisted tools, attackers will inevitably do the same. This piece explores the " +
      "philosophical implications and potential futures without reference to any specific incident.",
    nearest_incident_json_or_null: NO_NEAREST,
  },
  mockedResponse: JSON.stringify({
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Opinion/commentary article about AI and cybersecurity. No named victim, threat actor, CVE, or specific incident described.",
    reason_code: "not_an_incident",
  }),
  expectedOutput: {
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Opinion/commentary article about AI and cybersecurity. No named victim, threat actor, CVE, or specific incident described.",
    reason_code: "not_an_incident",
  },
};

export const FIX_SKIP_OFF_TOPIC: Fixture = {
  name: "skip: off_topic — article unrelated to cybersecurity",
  input: {
    title: "New Battery Technology Could Power Electric Vehicles for 1000 Miles",
    url: "https://techcrunch.com/2026/04/ev-battery-breakthrough",
    source: "TechCrunch",
    published_at: "2026-04-24T11:00:00.000Z",
    body_1500:
      "Researchers at MIT have announced a breakthrough in solid-state battery technology that could " +
      "dramatically extend the range of electric vehicles. The new chemistry avoids dendrite formation " +
      "and enables energy densities three times higher than current lithium-ion cells.",
    nearest_incident_json_or_null: NO_NEAREST,
  },
  mockedResponse: JSON.stringify({
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Article is about battery technology for electric vehicles; entirely unrelated to cybersecurity.",
    reason_code: "off_topic",
  }),
  expectedOutput: {
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Article is about battery technology for electric vehicles; entirely unrelated to cybersecurity.",
    reason_code: "off_topic",
  },
};

export const FIX_SKIP_SPECULATION: Fixture = {
  name: "skip: speculation — theoretical threat scenario, no real event",
  input: {
    title: "Could Quantum Computers Break RSA Encryption by 2030?",
    url: "https://securityweek.com/2026/04/quantum-rsa-speculation",
    source: "SecurityWeek",
    published_at: "2026-04-25T13:00:00.000Z",
    body_1500:
      "Security researchers are debating whether cryptographically-relevant quantum computers could arrive " +
      "within the decade, potentially rendering RSA-2048 obsolete. While no such machine exists today, the " +
      "theoretical threat is driving NIST's post-quantum cryptography standardization effort.",
    nearest_incident_json_or_null: NO_NEAREST,
  },
  mockedResponse: JSON.stringify({
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Speculative article about a theoretical future threat. No actual incident, named victim, or attributed actor.",
    reason_code: "speculation",
  }),
  expectedOutput: {
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Speculative article about a theoretical future threat. No actual incident, named victim, or attributed actor.",
    reason_code: "speculation",
  },
};

export const FIX_SKIP_LOW_SEVERITY: Fixture = {
  name: "skip: low_severity — generic incident lacking significance signals",
  input: {
    title: "Small Phishing Campaign Targets Generic Email Users",
    url: "https://example-blog.com/2026/04/generic-phishing",
    source: "Example Blog",
    published_at: "2026-04-26T10:00:00.000Z",
    body_1500:
      "A new phishing campaign is targeting users of popular email services. The emails impersonate " +
      "shipping notifications and attempt to harvest credentials. No specific organization, CVE, threat " +
      "actor, or affected count has been identified.",
    nearest_incident_json_or_null: NO_NEAREST,
  },
  mockedResponse: JSON.stringify({
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Generic phishing campaign with no named victim organization, threat actor, CVE, or affected count.",
    reason_code: "low_severity",
  }),
  expectedOutput: {
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Generic phishing campaign with no named victim organization, threat actor, CVE, or affected count.",
    reason_code: "low_severity",
  },
};

export const ALL_FIXTURES: readonly Fixture[] = [
  FIX_PROCESS_KREBS_SHINY,
  FIX_SKIP_VENDOR_MARKETING,
  FIX_SKIP_NEAR_DUPLICATE,
  FIX_PROCESS_CVE_ADVISORY,
  FIX_SKIP_NOT_AN_INCIDENT,
  FIX_SKIP_OFF_TOPIC,
  FIX_SKIP_SPECULATION,
  FIX_SKIP_LOW_SEVERITY,
] as const;
