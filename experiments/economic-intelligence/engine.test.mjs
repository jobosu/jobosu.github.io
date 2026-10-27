import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticPrices,ema,backtest} from './engine.mjs';
const prices=syntheticPrices();
test('seeded synthetic data is reproducible',()=>{assert.deepEqual(syntheticPrices(),prices);assert.notDeepEqual(syntheticPrices({seed:123}),prices);});
test('EMA never uses future prices',()=>{const changed=prices.slice();changed[changed.length-1]*=100;assert.deepEqual(ema(changed,12).slice(0,-1),ema(prices,12).slice(0,-1));});
test('backtest is reproducible and charges costs',()=>{const a=backtest(prices);assert.deepEqual(a,backtest(prices));assert.equal(a.equity.length,120);assert.ok(a.metrics.feesPaid>=0);assert.ok(a.metrics.endingEquity<=backtest(prices,{feeBps:0,slippageBps:0}).metrics.endingEquity+1e-8);});
test('future bar cannot change earlier trades or equity',()=>{const a=backtest(prices),changed=prices.slice();changed[changed.length-1]*=2;const b=backtest(changed);assert.deepEqual(a.trades.filter(t=>t.index<prices.length-1),b.trades.filter(t=>t.index<prices.length-1));assert.deepEqual(a.equity.slice(0,-1),b.equity.slice(0,-1));});
test('flat market has no strategy trades',()=>{const r=backtest(Array(360).fill(100));assert.equal(r.metrics.trades,0);assert.equal(r.metrics.endingEquity,10000);assert.ok(r.metrics.benchmarkReturnPct<0);});
test('invalid data and assumptions fail closed',()=>{assert.throws(()=>syntheticPrices({points:20}),RangeError);assert.throws(()=>backtest([1,2,3]),RangeError);assert.throws(()=>backtest(prices,{feeBps:-1}),RangeError);assert.throws(()=>backtest(prices,{splitIndex:359}),RangeError);});

test('benchmark starts in cash and enters at the same first executable bar',()=>{
 const r=backtest(prices);
 assert.equal(r.benchmarkEquity[0],r.config.initialCash);
 const entry=r.config.splitIndex+1,fee=r.config.feeBps/10000,slip=r.config.slippageBps/10000;
 const units=(r.config.initialCash/(1+fee))/(prices[entry]*(1+slip));
 assert.ok(Math.abs(r.benchmarkEquity[1]-units*prices[entry])<1e-8);
});
