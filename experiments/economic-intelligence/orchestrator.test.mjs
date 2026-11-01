import test from 'node:test';
import assert from 'node:assert/strict';
import {ROLES,mockAdapters,runProtocol} from './orchestrator.mjs';
test('mock debate visits all roles in order',async()=>{const result=await runProtocol({adapters:mockAdapters()});assert.deepEqual(result.transcript.map(m=>m.role),ROLES);assert.equal(result.connectedProviders,0);assert.ok(result.transcript.every(m=>m.mock));});
test('refuses real provider mode',async()=>{await assert.rejects(runProtocol({adapters:mockAdapters(),mode:'live'}),/disabled/);});
test('refuses missing adapter and uncited claims',async()=>{await assert.rejects(runProtocol({adapters:{}}),/missing adapter/);const adapters=mockAdapters();adapters.quant=async()=>({summary:'Claim',sources:[],limitations:['none']});await assert.rejects(runProtocol({adapters}),/sources required/);});
test('passes prior transcript without mutating it',async()=>{const adapters=mockAdapters();let count=0;for(const role of ROLES){const base=adapters[role];adapters[role]=async input=>{assert.equal(input.history.length,count++);return base(input);};}await runProtocol({adapters});assert.equal(count,4);});

test('mock-only provenance gate rejects external and malformed source references',async()=>{
 for(const source of ['https://example.org/market','synthetic://../secret','',42]){
  const adapters=mockAdapters();
  adapters.researcher=async()=>({summary:'Fictitious observation',sources:[source],limitations:['Not evidence']});
  await assert.rejects(runProtocol({adapters}),/sources required|mock sources must use synthetic:\/\//);
 }
});
test('mock fixtures are explicitly synthetic and do not claim verified markets',async()=>{
 const session=await runProtocol({adapters:mockAdapters()});
 assert.equal(session.verifiedMarketClaims,0);
 assert.equal(session.liveTrades,0);
 assert.equal(session.connectedProviders,0);
 for(const message of session.transcript){
  assert.ok(message.sources.every(source=>source.startsWith('synthetic://')));
  assert.ok(message.limitations.length>0);
 }
});
