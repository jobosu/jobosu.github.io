/** Robustness diagnostics over deterministic SYNTHETIC scenarios only.
 * No network, market data, external agents, brokerage access or orders.
 * Repeated seeds are NOT statistically independent real-world observations.
 */
import {syntheticPrices,backtest} from './engine.mjs';
export const SCENARIOS=Object.freeze(['regimes','trend','chop']);
function median(numbers){
 const values=[...numbers].sort((a,b)=>a-b);
 const middle=Math.floor(values.length/2);
 return values.length%2?values[middle]:(values[middle-1]+values[middle])/2;
}
function quantile(numbers,q){
 const values=[...numbers].sort((a,b)=>a-b);
 const position=(values.length-1)*q,lower=Math.floor(position),upper=Math.ceil(position);
 return values[lower]+(values[upper]-values[lower])*(position-lower);
}
function summary(rows){
 const excess=rows.map(row=>row.excessReturnPct);
 const underperformCount=rows.filter(row=>row.excessReturnPct<=0).length;
 return {
  runs:rows.length,
  outperformCount:rows.filter(row=>row.excessReturnPct>0).length,
  outperformPct:100*rows.filter(row=>row.excessReturnPct>0).length/rows.length,
  medianExcessPct:median(excess),
  underperformCount,
  underperformPct:100*underperformCount/rows.length,
  p10ExcessPct:quantile(excess,0.10),
  p90ExcessPct:quantile(excess,0.90),
  medianStrategyPct:median(rows.map(row=>row.strategyReturnPct)),
  medianBenchmarkPct:median(rows.map(row=>row.benchmarkReturnPct)),
  worstExcessPct:Math.min(...rows.map(row=>row.excessReturnPct)),
  worstDrawdownPct:Math.max(...rows.map(row=>row.maxDrawdownPct)),
 };
}
/** Returns per-scenario summaries and reproducible observations; no claims of edge. */
export function robustnessAudit({seeds=32,startSeed=20261027,scenarios=SCENARIOS}={}){
 if(!Number.isInteger(seeds)||seeds<8||seeds>200)throw new RangeError('seeds must be an integer from 8 to 200');
 if(!Number.isInteger(startSeed)||startSeed<1||startSeed>4294967295-seeds+1)throw new RangeError('seed range exceeds 32-bit limits');
 if(!Array.isArray(scenarios)||!scenarios.length||scenarios.length>SCENARIOS.length||new Set(scenarios).size!==scenarios.length||scenarios.some(s=>!SCENARIOS.includes(s)))throw new RangeError('invalid scenarios');
 const groups=[];
 for(const scenario of scenarios){
  const rows=[];
  for(let i=0;i<seeds;i++){
   const seed=startSeed+i;
   const result=backtest(syntheticPrices({seed,scenario}));
   const m=result.metrics;
   rows.push({
    seed,scenario,
    strategyReturnPct:m.strategyReturnPct,
    benchmarkReturnPct:m.benchmarkReturnPct,
    excessReturnPct:m.strategyReturnPct-m.benchmarkReturnPct,
    maxDrawdownPct:m.maxDrawdownPct,
    feesPaid:m.feesPaid
   });
  }
  groups.push({scenario,...summary(rows),rows});
 }
 return {
  kind:'SYNTHETIC_ROBUSTNESS_AUDIT',
  simulatedOnly:true,
  independentMarketEvidence:false,
  seedsPerScenario:seeds,
  startSeed,
  totalRuns:seeds*scenarios.length,
  groups,
  overall:summary(groups.flatMap(group=>group.rows)),
  limitations:[
   'Synthetic seeded paths are not observed market data or independent financial evidence.',
   'No hyperparameter optimization or walk-forward training is performed; the first 240 bars only warm up EMAs.',
   'Execution costs are simplified; liquidity, spreads, market impact and tax are not modelled.',
   'Performance across these paths cannot establish predictive power or expected live returns.',
   'P10/P90 are empirical percentiles of synthetic runs, not confidence intervals, real-market probabilities or value-at-risk estimates.'
  ]
 };
}
