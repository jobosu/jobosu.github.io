import test from 'node:test';
import assert from 'node:assert/strict';
import {adjudicateMockProposal,DECISION_SCHEMA} from './decision-gate.mjs';
import {runProtocol,mockAdapters,ROLES} from './orchestrator.mjs';

const REF='synthetic://prices/seed-20261026';
const proposal=()=>({id:'MOCK-EMA-001',hypothesis:'A fictional EMA hypothesis for synthetic-only evaluation.',sourceRefs:[REF],simulationOnly:true});
const ballots=(stances=['SUPPORT','SUPPORT','SUPPORT','SUPPORT'])=>ROLES.map((role,i)=>({role,stance:stances[i],reason:'Mock role assessment, not market evidence.',sourceRefs:[REF]}));
const session=()=>runProtocol({adapters:mockAdapters()});

test('unanimous mock support is research-only, never publication or trading authorization',async()=>{
 const result=adjudicateMockProposal({session:await session(),proposal:proposal(),ballots:ballots()});
 assert.equal(result.schema,DECISION_SCHEMA);
 assert.equal(result.status,'MOCK_RESEARCH_CANDIDATE');
 assert.equal(result.simulatedOnly,true);
 assert.equal(result.publicationAuthorized,false);
 assert.equal(result.tradingAuthorized,false);
 assert.equal(result.independentMarketEvidence,false);
 assert.equal(result.connectedProviders,0);
 assert.equal(result.liveTrades,0);
 assert.equal(result.ballots.length,4);
});

test('skeptic veto cannot be overridden by editor or a majority',async()=>{
 const result=adjudicateMockProposal({session:await session(),proposal:proposal(),ballots:ballots(['SUPPORT','SUPPORT','VETO','SUPPORT'])});
 assert.equal(result.status,'MOCK_VETOED');
 assert.deepEqual(result.vetoRoles,['skeptic']);
 assert.equal(result.publicationAuthorized,false);
});

test('abstention produces unresolved result; output is deterministic and does not mutate input',async()=>{
 const input={session:await session(),proposal:proposal(),ballots:ballots(['SUPPORT','ABSTAIN','SUPPORT','SUPPORT'])};
 const original=structuredClone(input);
 const a=adjudicateMockProposal(input);
 assert.equal(a.status,'MOCK_UNRESOLVED');
 assert.deepEqual(a,adjudicateMockProposal(input));
 a.ballots[0].reason='changed after the audit';
 assert.deepEqual(input,original);
});

test('refuses missing, unordered, malformed or fabricated mock ballots',async()=>{
 const s=await session();
 for(const votes of [ballots().slice(0,3),ballots().reverse(),ballots().map((v,i)=>i===2?{...v,stance:'TRADE'}:v),ballots().map((v,i)=>i===0?{...v,sourceRefs:['https://example.com']}:v),ballots().map((v,i)=>i===0?{...v,apiKey:'secret'}:v)]){
  assert.throws(()=>adjudicateMockProposal({session:s,proposal:proposal(),ballots:votes}),TypeError);
 }
});

test('refuses external, unlisted or duplicate sources and live/provider sessions',async()=>{
 const s=await session();
 for(const refs of [['https://example.com'],['synthetic://unlisted'],[REF,REF],[]]){
  assert.throws(()=>adjudicateMockProposal({session:s,proposal:{...proposal(),sourceRefs:refs},ballots:ballots()}),TypeError);
 }
 for(const patch of [{mode:'live'},{connectedProviders:1},{liveTrades:1},{verifiedMarketClaims:1}]){
  assert.throws(()=>adjudicateMockProposal({session:{...s,...patch},proposal:proposal(),ballots:ballots()}),TypeError);
 }
});
