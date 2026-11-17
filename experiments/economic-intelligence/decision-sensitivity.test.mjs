import test from 'node:test';
import assert from 'node:assert/strict';
import {runProtocol,mockAdapters} from './orchestrator.mjs';
import {auditMockDecisionSpace} from './decision-space.mjs';
import {inspectDecisionSensitivity,SENSITIVITY_SCHEMA} from './decision-sensitivity.mjs';
const makeAudit=async()=>{
 const session=await runProtocol({adapters:mockAdapters(),mode:'mock'});
 return auditMockDecisionSpace({session,proposal:{id:'MOCK-SENSITIVITY-001',hypothesis:'Only fictional rule sensitivity.',sourceRefs:[session.provenance.uniqueSourceRefs[0]],simulationOnly:true}});
};
test('eight valid single-vote neighbors for each of 81 cases',async()=>{
 const audit=await makeAudit();
 for(let i=0;i<81;i++){
  const report=inspectDecisionSensitivity(audit,i);
  assert.equal(report.schema,SENSITIVITY_SCHEMA);
  assert.equal(report.flips.length,8);
  assert.equal(report.pivotalFlips,report.flips.filter(f=>f.changesOutcome).length);
  assert.equal(report.connectedProviders,0);
  assert.equal(report.liveTrades,0);
  assert.equal(report.publicationAuthorized,false);
  assert.equal(report.tradingAuthorized,false);
  for(const flip of report.flips){
   assert.notEqual(flip.from,flip.to);
   assert.equal(flip.status,audit.outcomes[flip.targetCase-1].status);
   const changed=[...audit.outcomes[i].stances];changed[flip.roleIndex]=flip.to;
   assert.deepEqual(changed,audit.outcomes[flip.targetCase-1].stances);
  }
 }
});
test('unanimous fictional support is sensitive to all eight changes',async()=>{
 const report=inspectDecisionSensitivity(await makeAudit(),0);
 assert.equal(report.status,'MOCK_RESEARCH_CANDIDATE');
 assert.equal(report.pivotalFlips,8);
});
test('one abstention with three supports has five pivotal rule changes',async()=>{
 const audit=await makeAudit();
 const index=audit.outcomes.findIndex(o=>o.stances[0]==='ABSTAIN'&&o.stances.slice(1).every(s=>s==='SUPPORT'));
 assert.equal(inspectDecisionSensitivity(audit,index).pivotalFlips,5);
});
test('four fictional vetos have zero pivotal single-vote changes',async()=>{
 const audit=await makeAudit();
 const index=audit.outcomes.findIndex(o=>o.stances.every(s=>s==='VETO'));
 assert.equal(inspectDecisionSensitivity(audit,index).pivotalFlips,0);
});
test('rejects forged provider, trading, duplicated, misattributed or inconsistent audits',async()=>{
 const audit=await makeAudit();
 for(const patch of [{mode:'live'},{connectedProviders:1},{liveTrades:1},{publicationAuthorized:true},{totalCombinations:80}]){
  assert.throws(()=>inspectDecisionSensitivity({...audit,...patch},0),TypeError);
 }
 const wrong=structuredClone(audit);wrong.outcomes[0].status='MOCK_VETOED';
 assert.throws(()=>inspectDecisionSensitivity(wrong,0),TypeError);
 const duplicate=structuredClone(audit);duplicate.outcomes[1]=structuredClone(duplicate.outcomes[0]);
 assert.throws(()=>inspectDecisionSensitivity(duplicate,0),TypeError);
 const misattributed=structuredClone(audit);misattributed.outcomes[2].vetoRoles=[];
 assert.throws(()=>inspectDecisionSensitivity(misattributed,2),TypeError);
 assert.throws(()=>inspectDecisionSensitivity(audit,-1),RangeError);
 assert.throws(()=>inspectDecisionSensitivity(audit,81),RangeError);
});
test('deterministic report does not mutate the audited input',async()=>{
 const audit=await makeAudit(),before=structuredClone(audit);
 assert.deepEqual(inspectDecisionSensitivity(audit,7),inspectDecisionSensitivity(audit,7));
 assert.deepEqual(audit,before);
});