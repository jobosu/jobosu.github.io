import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticPrices,backtest,DEFAULTS} from './engine.mjs';

const base=syntheticPrices({seed:20261103,scenario:'regimes'});

test('causality: changing a future bar cannot alter earlier trades or equity',()=>{
 const pivot=310;
 const changed=[...base];
 for(let i=pivot;i<changed.length;i++)changed[i]*=1.35;
 const a=backtest(base),b=backtest(changed);
 const testOffset=pivot-DEFAULTS.splitIndex;
 assert.deepEqual(a.equity.slice(0,testOffset),b.equity.slice(0,testOffset));
 assert.deepEqual(a.trades.filter(t=>t.index<pivot),b.trades.filter(t=>t.index<pivot));
});

test('execution boundary: no trade in warm-up or at split bar',()=>{
 const result=backtest(base);
 assert.ok(result.trades.every(t=>t.index>DEFAULTS.splitIndex && t.index<base.length));
 assert.equal(result.equity.length,base.length-DEFAULTS.splitIndex);
 assert.equal(result.equity[0],DEFAULTS.initialCash);
});

test('round-trip fees and slippage never improve a long-only benchmark',()=>{
 const zero=backtest(base,{feeBps:0,slippageBps:0});
 const costly=backtest(base,{feeBps:10,slippageBps:5});
 assert.ok(costly.metrics.benchmarkReturnPct<zero.metrics.benchmarkReturnPct);
});

test('determinism across synthetic scenarios and seeds',()=>{
 for(const scenario of ['regimes','trend','chop']){
  for(const seed of [1,20261103,4294967295]){
   const p=syntheticPrices({scenario,seed});
   assert.deepEqual(p,syntheticPrices({scenario,seed}));
   const a=backtest(p),b=backtest([...p]);
   assert.deepEqual(a.trades,b.trades);
   assert.deepEqual(a.equity,b.equity);
  }
 }
});

test('malformed or non-finite price inputs fail closed',()=>{
 for(const invalid of [NaN,Infinity,-1,0]){
  const p=[...base];p[280]=invalid;
  assert.throws(()=>backtest(p),RangeError);
 }
});

test('benchmark ledger is causal before a changed future bar',()=>{
 const pivot=300,changed=[...base];
 for(let i=pivot;i<changed.length;i++)changed[i]*=0.7;
 const before=backtest(base),after=backtest(changed);
 const prefix=pivot-DEFAULTS.splitIndex;
 assert.deepEqual(before.benchmarkEquity.slice(0,prefix),after.benchmarkEquity.slice(0,prefix));
});

test('benchmark costs reduce returns across all synthetic regimes',()=>{
 for(const scenario of ['regimes','trend','chop']){
  for(const seed of [1,20261103,4294967295]){
   const prices=syntheticPrices({scenario,seed});
   const free=backtest(prices,{feeBps:0,slippageBps:0});
   const costly=backtest(prices,{feeBps:10,slippageBps:5});
   assert.ok(costly.metrics.benchmarkReturnPct<free.metrics.benchmarkReturnPct,
    'Costs unexpectedly improved '+scenario+' / '+seed);
   assert.ok(Number.isFinite(costly.metrics.endingEquity)&&costly.metrics.endingEquity>0);
  }
 }
});
