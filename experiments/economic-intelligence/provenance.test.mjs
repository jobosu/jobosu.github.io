import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProvenanceLedger,PROVENANCE_SCHEMA} from './provenance.mjs';
import {mockAdapters,runProtocol} from './orchestrator.mjs';

test('ledger is deterministic, synthetic-only and reconciles with transcript',async()=>{
 const session=await runProtocol({adapters:mockAdapters()});
 const ledger=buildProvenanceLedger(session);
 assert.deepEqual(ledger,buildProvenanceLedger(session));
 assert.equal(ledger.schema,PROVENANCE_SCHEMA);
 assert.equal(ledger.entries.length,4);
 assert.equal(ledger.connectedProviders,0);
 assert.equal(ledger.liveTrades,0);
 assert.equal(ledger.verifiedMarketClaims,0);
 assert.equal(ledger.simulatedOnly,true);
 assert.deepEqual(ledger.entries.map(e=>e.role),['researcher','quant','skeptic','editor']);
 assert.deepEqual(ledger.entries.map(e=>e.id),['MOCK-01','MOCK-02','MOCK-03','MOCK-04']);
 for(const entry of ledger.entries){
  assert.equal(entry.claimStatus,'UNVERIFIED_SYNTHETIC');
  assert.equal(entry.marketEvidence,false);
  assert.ok(entry.sourceRefs.every(s=>s.startsWith('synthetic://')));
  assert.ok(entry.limitations.length>0);
 }
 assert.equal(ledger.uniqueSourceRefs.length,1);
});

test('ledger rejects real mode, live trades, connected providers and verified-market claims',async()=>{
 const session=await runProtocol({adapters:mockAdapters()});
 for(const patch of [{mode:'live'},{connectedProviders:1},{liveTrades:1},{verifiedMarketClaims:1}]){
  assert.throws(()=>buildProvenanceLedger({...session,...patch}),/Only zero-provider/);
 }
});

test('ledger rejects forged external sources, role changes and missing limitations',async()=>{
 const session=await runProtocol({adapters:mockAdapters()});
 const altered=change=>{
  const copy=structuredClone(session);
  change(copy.transcript);
  return copy;
 };
 assert.throws(()=>buildProvenanceLedger(altered(t=>{t[0].sources=['https://example.com/quote'];})),/external source/);
 assert.throws(()=>buildProvenanceLedger(altered(t=>{t[0].sources=['synthetic://../secrets'];})),/external source/);
 assert.throws(()=>buildProvenanceLedger(altered(t=>{t[0].limitations=[];})),/limitations/);
 assert.throws(()=>buildProvenanceLedger(altered(t=>{t[1].role='researcher';})),/Invalid mock role/);
 assert.throws(()=>buildProvenanceLedger(altered(t=>{t[2].mock=false;})),/Invalid mock role/);
});

test('ledger refuses incomplete sessions and preserves the original transcript',async()=>{
 const session=await runProtocol({adapters:mockAdapters()});
 const original=structuredClone(session);
 assert.throws(()=>buildProvenanceLedger({...session,transcript:session.transcript.slice(0,3)}),/Incomplete/);
 const ledger=buildProvenanceLedger(session);
 ledger.entries[0].claim='locally edited';
 assert.deepEqual(session,original);
});
