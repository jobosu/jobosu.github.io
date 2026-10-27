/** JOBOSU Economic Intelligence v0.1.0. Synthetic-only, no network or brokerage calls. */
export const ENGINE_VERSION='0.1.0';
export const DEFAULTS=Object.freeze({initialCash:10000,feeBps:10,slippageBps:5,fastPeriod:12,slowPeriod:26,splitIndex:240});
function check(n,name,min,max){if(!Number.isFinite(n)||n<min||n>max)throw new RangeError(name+' outside allowed range');}
export function syntheticPrices({seed=20261026,points=360,scenario='regimes'}={}){
 check(seed,'seed',1,4294967295);
 if(!Number.isInteger(points)||points<60||points>5000)throw new RangeError('invalid points');
 if(!['regimes','trend','chop'].includes(scenario))throw new RangeError('unknown scenario');
 let state=seed>>>0,price=100;const values=[];
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};
 for(let i=0;i<points;i++){
  const z=(random()+random()+random()-1.5)*2,phase=i/points;
  const drift=scenario==='trend'?.001:scenario==='chop'?0:phase<.36?.0013:phase<.69?-.0015:.00045;
  price*=Math.exp(drift+(scenario==='chop'?.016:.011)*z);
  values.push(Number(price.toFixed(6)));
 }return values;
}
export function ema(prices,period){
 if(!Array.isArray(prices)||!prices.length)throw new RangeError('prices required');
 if(!Number.isInteger(period)||period<2||period>prices.length)throw new RangeError('invalid EMA period');
 const k=2/(period+1);let prev=prices[0];
 return prices.map((p,i)=>{check(p,'price',Number.EPSILON,Number.MAX_VALUE);prev=i===0?p:p*k+prev*(1-k);return prev;});
}
const pct=(a,b)=>(a/b-1)*100;
function maxDrawdown(values){let peak=0,max=0;for(const value of values){peak=Math.max(peak,value);max=Math.max(max,(peak-value)/peak);}return max*100;}
/** Causal signal at t-1, execution at t. Only test-window equity counts. */
export function backtest(prices,options={}){
 const c={...DEFAULTS,...options};
 if(!Array.isArray(prices)||prices.length<60)throw new RangeError('at least 60 prices required');
 prices.forEach(p=>check(p,'price',Number.EPSILON,Number.MAX_VALUE));
 check(c.initialCash,'initialCash',1,1e12);check(c.feeBps,'feeBps',0,1000);check(c.slippageBps,'slippageBps',0,1000);
 if(!Number.isInteger(c.fastPeriod)||!Number.isInteger(c.slowPeriod)||c.fastPeriod<2||c.slowPeriod<=c.fastPeriod||c.slowPeriod>=prices.length)throw new RangeError('invalid EMA periods');
 if(!Number.isInteger(c.splitIndex)||c.splitIndex<c.slowPeriod+1||c.splitIndex>=prices.length-2)throw new RangeError('invalid split');
 const fast=ema(prices,c.fastPeriod),slow=ema(prices,c.slowPeriod),feeRate=c.feeBps/10000,slip=c.slippageBps/10000;
 let cash=c.initialCash,units=0,feesPaid=0;const equity=[],trades=[];
 function buy(i){const px=prices[i]*(1+slip),fee=cash*feeRate/(1+feeRate);units=(cash-fee)/px;feesPaid+=fee;cash=0;trades.push({index:i,side:'BUY',executionPrice:px,fee});}
 function sell(i){const px=prices[i]*(1-slip),gross=units*px,fee=gross*feeRate;cash=gross-fee;units=0;feesPaid+=fee;trades.push({index:i,side:'SELL',executionPrice:px,fee});}
 for(let i=c.splitIndex;i<prices.length;i++){
  if(i>c.splitIndex){const longSignal=fast[i-1]>slow[i-1];if(longSignal&&units===0)buy(i);else if(!longSignal&&units>0)sell(i);}
  if(i===prices.length-1&&units>0)sell(i);
  equity.push(cash+units*prices[i]);
 }
 // Match the benchmark entry to the strategy's first executable bar, not the warm-up boundary.
 const entryIndex=c.splitIndex+1,end=prices.at(-1);
 const benchmarkUnits=(c.initialCash/(1+feeRate))/(prices[entryIndex]*(1+slip));
 const benchmarkEnd=benchmarkUnits*end*(1-slip)*(1-feeRate);
 const benchmarkEquity=prices.slice(c.splitIndex).map((p,j,a)=>j===0?c.initialCash:j===a.length-1?benchmarkEnd:benchmarkUnits*p);
 return {config:c,sample:{trainBars:c.splitIndex,testBars:prices.length-c.splitIndex},equity,benchmarkEquity,trades,
 metrics:{strategyReturnPct:pct(equity.at(-1),c.initialCash),benchmarkReturnPct:pct(benchmarkEnd,c.initialCash),
 maxDrawdownPct:maxDrawdown([c.initialCash,...equity]),trades:trades.length,feesPaid,endingEquity:equity.at(-1)}};
}