import test from 'node:test';
import assert from 'node:assert/strict';
import {robustnessAudit,SCENARIOS} from './robustness.mjs';

test('audit is deterministic and clearly marked synthetic-only',()=>{
 const a=robustnessAudit({seeds:8,startSeed:99});
 assert.deepEqual(a,robustnessAudit({seeds:8,startSeed:99}));
 assert.equal(a.totalRuns,24);
 assert.equal(a.groups.length,3);
 assert.equal(a.simulatedOnly,true);
 assert.equal(a.independentMarketEvidence,false);
 assert.ok(a.limitations.length>=3);
});
test('per-scenario observations and aggregates reconcile exactly',()=>{
 const audit=robustnessAudit({seeds:12,startSeed:500});
 assert.deepEqual(audit.groups.map(g=>g.scenario),SCENARIOS);
 for(const group of audit.groups){
  assert.equal(group.runs,12);
  assert.equal(group.rows.length,12);
  assert.equal(group.outperformCount,group.rows.filter(r=>r.excessReturnPct>0).length);
  assert.equal(group.outperformPct,100*group.outperformCount/12);
  assert.ok(group.outperformPct>=0&&group.outperformPct<=100);
  assert.equal(group.worstDrawdownPct,Math.max(...group.rows.map(r=>r.maxDrawdownPct)));
  assert.equal(group.worstExcessPct,Math.min(...group.rows.map(r=>r.excessReturnPct)));
  for(const row of group.rows){
   assert.equal(row.excessReturnPct,row.strategyReturnPct-row.benchmarkReturnPct);
   assert.ok(row.feesPaid>=0);
   assert.ok(row.maxDrawdownPct>=0);
  }
 }
});
test('different seeds produce different synthetic samples',()=>{
 const a=robustnessAudit({seeds:8,startSeed:100,scenarios:['trend']});
 const b=robustnessAudit({seeds:8,startSeed:200,scenarios:['trend']});
 assert.notDeepEqual(a.groups[0].rows,b.groups[0].rows);
});
test('invalid audit configurations fail closed',()=>{
 for(const args of [
  {seeds:7},{seeds:201},{seeds:8.5},{seeds:8,startSeed:0},
  {seeds:8,startSeed:4294967290},{scenarios:[]},
  {scenarios:['trend','trend']},{scenarios:['real-market']},
  {scenarios:'trend'}
 ])assert.throws(()=>robustnessAudit(args),RangeError);
});
