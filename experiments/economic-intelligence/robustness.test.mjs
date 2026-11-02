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


test('downside lens reconciles with all synthetic runs and uses empirical percentiles',()=>{
 const audit=robustnessAudit({seeds:16,startSeed:750});
 const allRows=audit.groups.flatMap(group=>group.rows);
 const quantile=(values,p)=>{
  const sorted=[...values].sort((a,b)=>a-b),position=(sorted.length-1)*p;
  const low=Math.floor(position),high=Math.ceil(position);
  return sorted[low]+(sorted[high]-sorted[low])*(position-low);
 };
 assert.equal(audit.overall.runs,48);
 assert.equal(audit.overall.underperformCount,allRows.filter(row=>row.excessReturnPct<=0).length);
 assert.equal(audit.overall.underperformCount+audit.overall.outperformCount,48);
 for(const {stats,rows} of [
  ...audit.groups.map(group=>({stats:group,rows:group.rows})),
  {stats:audit.overall,rows:allRows}
 ]){
  const excess=rows.map(row=>row.excessReturnPct);
  assert.equal(stats.underperformCount,rows.filter(row=>row.excessReturnPct<=0).length);
  assert.equal(stats.underperformPct,100*stats.underperformCount/rows.length);
  assert.equal(stats.p10ExcessPct,quantile(excess,.10));
  assert.equal(stats.p90ExcessPct,quantile(excess,.90));
  assert.ok(stats.worstExcessPct<=stats.p10ExcessPct);
  assert.ok(stats.p10ExcessPct<=stats.medianExcessPct);
  assert.ok(stats.medianExcessPct<=stats.p90ExcessPct);
  assert.ok(stats.p90ExcessPct<=Math.max(...excess));
 }
 assert.ok(audit.limitations.some(text=>text.includes('not confidence intervals')));
});
