import test from 'node:test';
import assert from 'node:assert/strict';
import {auditMockDecisionSpace,DECISION_SPACE_SCHEMA} from './decision-space.mjs';
import {runProtocol,mockAdapters,ROLES} from './orchestrator.mjs';

const REF='synthetic://prices/seed-20261026';
const proposal=()=>({id:'MOCK-EMA-001',hypothesis:'Fictional EMA hypothesis, synthetic only.',sourceRefs:[REF],simulationOnly:true});
const session=()=>runProtocol({adapters:mockAdapters()});

test('exhaustive 3^4 mock outcomes reconcile exactly and preserve safety flags',async()=>{
 const audit=auditMockDecisionSpace({session:await session(),proposal:proposal()});
 assert.equal(audit.schema,DECISION_SPACE_SCHEMA);
 assert.equal(audit.totalCombinations,81);
 assert.deepEqual(audit.statusCounts,{MOCK_VETOED:65,MOCK_UNRESOLVED:15,MOCK_RESEARCH_CANDIDATE:1});
 assert.deepEqual(audit.vetoByRole,{researcher:27,quant:27,skeptic:27,editor:27});
 assert.deepEqual(audit.roleOrder,ROLES);
 assert.equal(audit.outcomes.length,81);
 assert.equal(new Set(audit.outcomes.map(o=>o.stances.join('/'))).size,81);
 for(const key of ['publicationAuthorized','tradingAuthorized','independentMarketEvidence'])assert.equal(audit[key],false);
 assert.equal(audit.connectedProviders,0);
 assert.equal(audit.liveTrades,0);
 assert.match(audit.interpretation,/NOT probabilities/);
});

test('every veto blocks; abstentions without veto remain unresolved; only unanimity is candidate',async()=>{
 const {outcomes}=auditMockDecisionSpace({session:await session(),proposal:proposal()});
 for(const outcome of outcomes){
  const veto=outcome.stances.includes('VETO');
  const allSupport=outcome.stances.every(s=>'SUPPORT'===s);
  assert.equal(outcome.status,veto?'MOCK_VETOED':allSupport?'MOCK_RESEARCH_CANDIDATE':'MOCK_UNRESOLVED');
  assert.deepEqual(outcome.vetoRoles,ROLES.filter((role,i)=>outcome.stances[i]==='VETO'));
  if(outcome.stances[2]==='VETO')assert.equal(outcome.status,'MOCK_VETOED');
 }
});

test('counterfactual audit is deterministic and does not mutate source inputs',async()=>{
 const input={session:await session(),proposal:proposal()};
 const original=structuredClone(input);
 assert.deepEqual(auditMockDecisionSpace(input),auditMockDecisionSpace(input));
 assert.deepEqual(input,original);
});

test('rejects forged live/provider sessions and external or unlisted references',async()=>{
 const s=await session();
 for(const patch of [{mode:'live'},{connectedProviders:1},{liveTrades:1},{verifiedMarketClaims:1}]){
  assert.throws(()=>auditMockDecisionSpace({session:{...s,...patch},proposal:proposal()}),TypeError);
 }
 for(const sourceRefs of [['https://example.org'],['synthetic://unlisted'],[REF,REF],[]]){
  assert.throws(()=>auditMockDecisionSpace({session:s,proposal:{...proposal(),sourceRefs}}),TypeError);
 }
 assert.throws(()=>auditMockDecisionSpace({session:s,proposal:{...proposal(),simulationOnly:false}}),TypeError);
});
