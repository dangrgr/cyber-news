import { it } from "node:test";
import assert from "node:assert/strict";
import { createResponses, EvidenceHold, ProviderUnavailable, verifyForDiscord } from "../../src/clients/openai.ts";
import type { IncidentRow } from "../../src/turso/incidents.ts";
import { restartCutoff } from "../../src/util/cutoff.ts";

const victim = "https://company.example/disclosure";
const allegation = "https://news.example/interview";
const incident = {id:"incident", title:"Draft containing unchecked claims"} as IncidentRow;
const claims = [
  {statement:"The company confirmed a breach.", source:victim, claimant:null},
  {statement:"A million customer records were taken.", source:allegation, claimant:"Group A"},
];
function response(items: typeof claims, urls: string[], status = "completed") {
  return createResponses("fake", async () => Response.json({model:"gpt-5.4-mini", status:"completed",
    usage:{input_tokens:100, output_tokens:23}, output:[
      {type:"web_search_call", status, action:{type:"search",sources:urls.map(url=>({url}))}},
      {type:"message",content:[{type:"output_text",text:JSON.stringify({claims:items})}]},
    ]}));
}
it("keeps the company confirmation and actor-only count separately attributed and cited", async () => {
  const data = await verifyForDiscord(response(claims,[victim,allegation]),"model",incident,{});
  const body = data.embeds![0]!.description!;
  assert.ok(body.includes(victim) && body.includes("Group A claims (unverified)") && body.includes(allegation));
  assert.ok(!body.includes(incident.title));
});
it("renders a single allegation without counting outlets repeating it", async () => {
  const data = await verifyForDiscord(response(claims.slice(1),[allegation,"https://syndication.example/1","https://other.example/2"]),"model",incident,{});
  assert.match(data.embeds![0]!.description!, /Group A claims/);
  assert.doesNotMatch(data.embeds![0]!.description!, /syndication|corroborat|independent/);
});
it("defers incomplete searches and holds claims with invented citations", async () => {
  await assert.rejects(verifyForDiscord(response(claims,[victim],"failed"),"model",incident,{}),ProviderUnavailable);
  await assert.rejects(verifyForDiscord(response(claims,[]),"model",incident,{}),EvidenceHold);
});
it("requires a valid UTC restart date when configured", () => {
  assert.throws(()=>restartCutoff("tomorrow"));
  assert.equal(restartCutoff("2026-11-22T18:00:00Z"),"2026-11-22T18:00:00.000Z");
});
