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
  }),
  expectedOutput: {
    decision: "process",
    novel: true,
    significant: true,
    duplicate_of: null,
    reason: "Named victim (Cisco), named threat actor (ShinyHunters), confirmed by SEC 8-K, fits SLH campaign.",
  },
};

export const FIX_SKIP_VENDOR_MARKETING: Fixture = {
  name: "skip: vendor marketing post with no incident",
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
  }),
  expectedOutput: {
    decision: "skip",
    novel: false,
    significant: false,
    duplicate_of: null,
    reason: "Vendor marketing content; no named victim, actor, or incident.",
  },
};

export const FIX_SKIP_NEAR_DUPLICATE: Fixture = {
  name: "skip: near-duplicate of existing incident, no new facts",
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
  }),
  expectedOutput: {
    decision: "skip",
    novel: false,
    significant: true,
    duplicate_of: "inc-cisco-shiny-2026-04",
    reason: "Recap of existing incident with no new facts beyond Krebs' original reporting.",
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
  }),
  expectedOutput: {
    decision: "process",
    novel: true,
    significant: true,
    duplicate_of: null,
    reason: "Named CVE, active exploitation, CISA KEV listing, named vendor.",
  },
};

export const ALL_FIXTURES: readonly Fixture[] = [
  FIX_PROCESS_KREBS_SHINY,
  FIX_SKIP_VENDOR_MARKETING,
  FIX_SKIP_NEAR_DUPLICATE,
  FIX_PROCESS_CVE_ADVISORY,
] as const;
