import {syntheticPrices,backtest,ENGINE_VERSION} from './engine.mjs';
const $=id=>document.getElementById(id);
const format=(v,d=2)=>new Intl.NumberFormat('ca-ES',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
const pct=v=>(v>0?'+':'')+format(v)+'%';
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs={}){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node;}
function plot(result){
 const svg=$('ei-chart');svg.replaceChildren();
 const arrays=[result.equity,result.benchmarkEquity],values=arrays.flat();
 const min=Math.min(...values),max=Math.max(...values),pad=Math.max(10,(max-min)*.12),lo=min-pad,hi=max+pad;
 for(let i=0;i<5;i++){const y=18+i*69;svg.append(el('line',{x1:0,x2:800,y1:y,y2:y,stroke:'#26424a','stroke-dasharray':'3 6'}));const t=el('text',{x:10,y:y-6,fill:'#8ca9b0','font-size':11});t.textContent=format(hi-i*(hi-lo)/4,0);svg.append(t);}
 const path=arr=>arr.map((v,i)=>(i?'L':'M')+(800*i/(arr.length-1)).toFixed(2)+','+(18+(1-(v-lo)/(hi-lo))*276).toFixed(2)).join(' ');
 svg.append(el('path',{d:path(result.benchmarkEquity),fill:'none',stroke:'#e1b47a','stroke-width':2.2,'vector-effect':'non-scaling-stroke'}));
 svg.append(el('path',{d:path(result.equity),fill:'none',stroke:'#79f2d3','stroke-width':2.8,'vector-effect':'non-scaling-stroke'}));
 const title=el('title');title.textContent='Capital simulat final: estratègia '+format(result.metrics.endingEquity)+' unitats; referència '+format(result.benchmarkEquity.at(-1))+' unitats. Dades sintètiques.';svg.prepend(title);
}
function render(){
 const status=$('ei-run-status');
 try{
  const prices=syntheticPrices({seed:Number($('ei-seed').value),scenario:$('ei-scenario').value}),result=backtest(prices);
  plot(result);
  for(const [id,value] of [['ei-strategy',result.metrics.strategyReturnPct],['ei-benchmark',result.metrics.benchmarkReturnPct]]){
   const node=$(id);node.textContent=pct(value);node.className=value>=0?'ei-positive':'ei-negative';
  }
  $('ei-drawdown').textContent=format(result.metrics.maxDrawdownPct)+'%';
  $('ei-trades').textContent=result.metrics.trades+' execucions';
  $('ei-fees').textContent='Comissions: '+format(result.metrics.feesPaid)+' unitats';
  status.textContent='Simulació local completada · motor v'+ENGINE_VERSION+'.';
 }catch(error){status.textContent='No executat: '+(error instanceof Error?error.message:'error desconegut');}
}
$('ei-run').addEventListener('click',render);
render();
